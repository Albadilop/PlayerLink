"""
Cliente Supabase con service_role (solo servidor).

Úsalo para Auth admin, Storage, o tablas sin RLS cuando integres flujos con Supabase.
Nunca expongas SUPABASE_SERVICE_ROLE_KEY al front ni la commits.
"""
from __future__ import annotations

import logging
import os
from typing import Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

_admin_client: Optional[Any] = None


def get_supabase_admin() -> Optional[Any]:
    """
    Crea un cliente Supabase con la service role key, o None si faltan env.
    Importación perezosa del SDK para no romper entornos sin el paquete instalado.
    """
    global _admin_client
    if _admin_client is not None:
        return _admin_client

    url = (os.getenv("SUPABASE_URL") or "").strip()
    key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        return None

    try:
        from supabase import create_client
    except ImportError:
        return None

    _admin_client = create_client(url, key)
    return _admin_client


def is_supabase_admin_configured() -> bool:
    return bool(
        (os.getenv("SUPABASE_URL") or "").strip()
        and (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    )


def fetch_supabase_user_from_jwt(access_token: str) -> Optional[Tuple[str, str]]:
    """
    Valida el access token de Supabase contra Auth (vía cliente service_role)
    y devuelve (auth_user_id, email_normalizado) o None si no es válido.

    Fase 3: usar desde POST /api/supabase_bootstrap (nunca confiar solo en el body).
    """
    admin = get_supabase_admin()
    token = (access_token or "").strip()
    if not admin or not token:
        return None
    try:
        resp = admin.auth.get_user(token)
    except Exception:
        return None
    if not resp or not getattr(resp, "user", None):
        return None
    u = resp.user
    email = (u.email or "").strip().lower()
    auth_uid = str(u.id).strip() if u.id else ""
    if not email or not auth_uid:
        return None
    return (auth_uid, email)


def _normalize_list_users_batch(batch: Any) -> List[Any]:
    if batch is None:
        return []
    if isinstance(batch, list):
        return batch
    users = getattr(batch, "users", None)
    if isinstance(users, list):
        return users
    return []


def find_supabase_auth_id_by_email(email: str) -> Optional[str]:
    """
    Busca auth.users por email (comparación case-insensitive) paginando list_users.
    Coste O(n) en número de usuarios Auth; usar solo para enlazar cuentas poco frecuentes
    o cuando SUPABASE_AUTO_LINK_ON_LOGIN / export lo requieran.
    """
    admin = get_supabase_admin()
    if not admin or not (email or "").strip():
        return None
    email_norm = email.strip().lower()
    try:
        list_users = admin.auth.admin.list_users
    except Exception as e:
        logger.debug("find_supabase_auth_id_by_email: no list_users: %s", e)
        return None
    max_pages = int((os.getenv("SUPABASE_AUTH_EMAIL_LOOKUP_MAX_PAGES") or "10").strip() or "10")
    per_page = 100
    for page in range(1, max_pages + 1):
        try:
            batch = list_users(page=page, per_page=per_page)
        except Exception as e:
            logger.warning("find_supabase_auth_id_by_email: list_users page %s failed: %s", page, e)
            return None
        users = _normalize_list_users_batch(batch)
        if not users:
            return None
        for au in users:
            em = (getattr(au, "email", None) or "").strip().lower()
            if em == email_norm:
                uid = getattr(au, "id", None)
                if uid:
                    return str(uid).strip()
        if len(users) < per_page:
            return None
    return None


def _auth_user_to_export_dict(auth_user: Any) -> dict[str, Any]:
    """Subconjunto seguro para export GDPR (sin tokens de sesión)."""
    out: dict[str, Any] = {}
    if auth_user is None:
        return out
    if hasattr(auth_user, "model_dump"):
        raw = auth_user.model_dump()
        for k in (
            "id",
            "email",
            "phone",
            "created_at",
            "last_sign_in_at",
            "confirmed_at",
            "email_confirmed_at",
            "user_metadata",
            "app_metadata",
            "is_anonymous",
        ):
            if k in raw and raw[k] is not None:
                out[k] = raw[k]
        identities = raw.get("identities") or []
    else:
        for k in (
            "id",
            "email",
            "phone",
            "created_at",
            "last_sign_in_at",
            "confirmed_at",
            "email_confirmed_at",
            "user_metadata",
            "app_metadata",
            "is_anonymous",
        ):
            val = getattr(auth_user, k, None)
            if val is not None:
                out[k] = val
        identities = getattr(auth_user, "identities", None) or []

    safe_idents: list[dict[str, Any]] = []
    for ident in identities:
        if ident is None:
            continue
        if isinstance(ident, dict):
            id_row = ident
        elif hasattr(ident, "model_dump"):
            id_row = ident.model_dump()
        else:
            id_row = {
                "id": getattr(ident, "id", None),
                "provider": getattr(ident, "provider", None),
                "created_at": getattr(ident, "created_at", None),
                "updated_at": getattr(ident, "updated_at", None),
                "identity_data": getattr(ident, "identity_data", None) or {},
            }
        if not isinstance(id_row, dict):
            continue
        id_copy = {k: v for k, v in id_row.items() if k != "identity_data"}
        id_raw = id_row.get("identity_data") if isinstance(id_row.get("identity_data"), dict) else {}
        id_copy["identity_data"] = {
            k: v
            for k, v in id_raw.items()
            if "token" not in k.lower() and "secret" not in k.lower() and "access" not in k.lower()
        }
        safe_idents.append(id_copy)
    if safe_idents:
        out["identities"] = safe_idents
    return out


def fetch_supabase_auth_export_for_uid(auth_uid: str) -> dict[str, Any]:
    """
    Devuelve dict listo para JSON de export, o {"error": "..."} si falla.
    """
    admin = get_supabase_admin()
    uid = (auth_uid or "").strip()
    if not admin:
        return {"error": "Supabase admin client not configured (SUPABASE_URL / SERVICE_ROLE_KEY)."}
    if not uid:
        return {"error": "Missing supabase_auth_id."}
    try:
        resp = admin.auth.admin.get_user_by_id(uid)
    except Exception as e:
        logger.info("fetch_supabase_auth_export_for_uid failed: %s", e)
        return {"error": str(e)}
    auth_user = getattr(resp, "user", None) or resp
    try:
        return _auth_user_to_export_dict(auth_user)
    except Exception as e:
        logger.warning("fetch_supabase_auth_export_for_uid serialize failed: %s", e)
        return {"error": str(e)}


def supabase_status_payload() -> dict:
    """
    Datos seguros para GET /api/supabase_status (Fase 1).
    No incluye URLs completas ni fragmentos de claves.
    """
    import importlib.util

    url_set = bool((os.getenv("SUPABASE_URL") or "").strip())
    key_set = bool((os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip())
    sdk_installed = importlib.util.find_spec("supabase") is not None
    admin_ready = url_set and key_set and sdk_installed
    return {
        "supabase_url_configured": url_set,
        "service_role_configured": key_set,
        "python_supabase_sdk_installed": sdk_installed,
        "admin_client_ready": admin_ready,
        "note": (
            "Las variables VITE_SUPABASE_* solo las comprueba el build del front; "
            "no están disponibles en este endpoint."
        ),
    }

"""
Cliente Supabase con service_role (solo servidor).

Úsalo para Auth admin, Storage, o tablas sin RLS cuando integres flujos con Supabase.
Nunca expongas SUPABASE_SERVICE_ROLE_KEY al front ni la commits.
"""
from __future__ import annotations

import os
from typing import Any, Optional, Tuple

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

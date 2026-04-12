import logging
import os
from html import escape
from urllib.parse import urlencode

from flask_mail import Message

from api.mail.mail_config import mail

logger = logging.getLogger(__name__)

# Paleta alineada con Settings / modales privados (cyan, magenta, fondo oscuro).
_COLOR_BG = "#08081a"
_COLOR_CARD = "#0f1024"
_COLOR_BORDER = "#00e5ff"
_COLOR_ACCENT2 = "#e879f9"
_COLOR_TEXT = "#f1f5f9"
_COLOR_MUTED = "#94a3b8"
_COLOR_BTN_BG = "#000000"
_COLOR_BTN_TEXT = "#ffffff"


def _mail_sender() -> str | None:
    s = (os.getenv("MAIL_DEFAULT_SENDER") or os.getenv("MAIL_USERNAME") or "").strip()
    return s or None


def _playerlink_email_document(title: str, body_inner_html: str) -> str:
    """Plantilla HTML inline (compatible clientes de correo) con estética PlayerLink."""
    safe_title = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{safe_title}</title>
</head>
<body style="margin:0;padding:0;background:{_COLOR_BG};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:{_COLOR_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-radius:16px;overflow:hidden;border:2px solid {_COLOR_BORDER};background:{_COLOR_CARD};box-shadow:0 0 24px rgba(0,229,255,0.12);">
          <tr>
            <td style="padding:20px 24px;background:linear-gradient(90deg,{_COLOR_BORDER}33,transparent);border-bottom:1px solid rgba(0,229,255,0.25);">
              <p style="margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:{_COLOR_BORDER};font-weight:600;">PlayerLink</p>
              <h1 style="margin:8px 0 0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:700;color:{_COLOR_TEXT};line-height:1.25;">{safe_title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 32px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:{_COLOR_MUTED};">
              {body_inner_html}
              <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid rgba(148,163,184,0.2);font-size:13px;color:{_COLOR_MUTED};">
                — The PlayerLink team<br>
                <span style="color:{_COLOR_ACCENT2};">Play. Link. Win.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_email(address, token):
    try:
        front = (os.getenv("FRONTEND_URL") or "").strip().rstrip("/")
        if front:
            reset_url = f"{front}/reset?{urlencode({'token': token})}"
        else:
            reset_url = "#"
        reset_href = escape(reset_url, quote=True)
        reset_text = escape(reset_url)

        body = f"""
              <p style="margin:0 0 16px;color:{_COLOR_TEXT};">Hello,</p>
              <p style="margin:0 0 20px;">We received a request to reset the password for your account. If you made this request, use the button below to choose a new password.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td style="border-radius:10px;background:{_COLOR_BTN_BG};border:2px solid {_COLOR_BORDER};">
                    <a href="{reset_href}" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:{_COLOR_BTN_TEXT};text-decoration:none;border-radius:8px;">Reset password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:13px;">If the button does not work, copy and paste this link into your browser:</p>
              <p style="margin:0;word-break:break-all;font-size:12px;color:{_COLOR_BORDER};">{reset_text}</p>
              <p style="margin:24px 0 0;">If you did not request a reset, you can ignore this message. Your password will stay the same.</p>
"""
        msg = Message(
            "PlayerLink — Reset your password",
            recipients=[address],
            sender=_mail_sender(),
            html=_playerlink_email_document("Password reset", body),
        )
        mail.send(msg)
        return {"success": True, "msg": "correo enviado exitosamente"}
    except Exception as e:
        return {"success": False, "msg": "error al enviar correo: " + str(e)}


def send_password_changed_notification(address: str) -> dict:
    """
    Correo de aviso tras cambiar la contraseña (Settings o flujo /reset).
    No bloquea el cambio si el envío falla; el caller registra el resultado.
    """
    try:
        front = (os.getenv("FRONTEND_URL") or "").strip().rstrip("/")
        home_url = f"{front}/" if front else "#"
        home_href = escape(home_url, quote=True)
        home_label = escape(front if front else "PlayerLink")

        body = f"""
              <p style="margin:0 0 16px;color:{_COLOR_TEXT};">Hello,</p>
              <p style="margin:0 0 16px;">The password for your <strong style="color:{_COLOR_TEXT};">PlayerLink</strong> account was just updated successfully.</p>
              <p style="margin:0 0 20px;">If this was you, no action is needed.</p>
              <p style="margin:0 0 24px;padding:14px 16px;border-radius:10px;border:1px solid rgba(248,113,113,0.45);background:rgba(248,113,113,0.08);color:#fecaca;font-size:14px;">
                If you <strong>did not</strong> change your password, secure your account and contact support as soon as possible.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 0;">
                <tr>
                  <td style="border-radius:10px;background:{_COLOR_BTN_BG};border:2px solid {_COLOR_BORDER};">
                    <a href="{home_href}" style="display:inline-block;padding:12px 24px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:600;color:{_COLOR_BTN_TEXT};text-decoration:none;">Open PlayerLink</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:12px;word-break:break-all;color:{_COLOR_BORDER};">{home_label}</p>
"""
        msg = Message(
            "PlayerLink — Password updated",
            recipients=[address],
            sender=_mail_sender(),
            html=_playerlink_email_document("Password updated", body),
        )
        mail.send(msg)
        return {"success": True, "msg": "notification sent"}
    except Exception as e:
        logger.warning("send_password_changed_notification failed: %s", e)
        return {"success": False, "msg": str(e)}

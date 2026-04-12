import logging
import os

from flask_mail import Message

from api.mail.mail_config import mail

logger = logging.getLogger(__name__)


def _mail_sender() -> str | None:
    s = (os.getenv("MAIL_DEFAULT_SENDER") or os.getenv("MAIL_USERNAME") or "").strip()
    return s or None


def send_email(address, token):
    try:
        msg = Message(
            "Reset your password",
            recipients=[address],
            sender=_mail_sender(),
        )

        # Definir cuerpo del correo, utilizamos la variable de entorno para PROD os.getenv("BACKEND_URL"), en DEV ponemos la del FRONT si estas usando codespace.
        msg.html = f'''
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #4CAF50;">Password Reset Request</h2>
    <p>Hello,</p>
    <p>We received a request to reset the password for your account. If you made this request, you can set a new password by clicking the button below:</p>
    <p>
      <a href="{os.getenv("FRONTEND_URL")}/reset?token={token}" 
         style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
         Reset Password
      </a>
    </p>
    <p>If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.</p>
    <p>Thank you,<br>The PlayerLink Support Team</p>
  </div>
'''
        # Enviar el correo
        mail.send(msg)
        return {'success': True, 'msg': 'correo enviado exitosamente'}
    except Exception as e:
        return {'success': False, 'msg': 'error al enviar correo: ' + str(e)}


def send_password_changed_notification(address: str) -> dict:
    """
    Correo de aviso tras cambiar la contraseña (Settings o flujo /reset).
    No bloquea el cambio si el envío falla; el caller registra el resultado.
    """
    try:
        front = (os.getenv("FRONTEND_URL") or "").strip().rstrip("/")
        home_link = f'<a href="{front}/">{front}/</a>' if front else "PlayerLink"
        msg = Message(
            "Your PlayerLink password was changed",
            recipients=[address],
            sender=_mail_sender(),
            html=f"""
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #4CAF50;">Password updated</h2>
    <p>Hello,</p>
    <p>The password for your PlayerLink account was just changed successfully.</p>
    <p>If you made this change, you can ignore this message.</p>
    <p>If you did <strong>not</strong> change your password, secure your account and contact support immediately.</p>
    <p>Sign in: {home_link}</p>
    <p>Thank you,<br>The PlayerLink Team</p>
  </div>
""",
        )
        mail.send(msg)
        return {"success": True, "msg": "notification sent"}
    except Exception as e:
        logger.warning("send_password_changed_notification failed: %s", e)
        return {"success": False, "msg": str(e)}

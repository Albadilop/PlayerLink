"""
Authentication endpoints: register, login, password reset, token validation
"""
import logging
import os

from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from datetime import timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import select, func
from api.models import db, User, Profile
from api.validators import (
    validate_email,
    validate_password_strength,
    validate_json,
    handle_errors,
)
from api.base import BaseEndpoint
from api.rate_limiter import apply_rate_limit_if_available
from api.mail.mailer import send_email, send_password_changed_notification
from api.supabase_admin import find_supabase_auth_id_by_email, is_supabase_admin_configured
from typing import Tuple

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)
base = BaseEndpoint()


@auth_bp.route('/register', methods=['POST'])
@apply_rate_limit_if_available("5 per minute")
@handle_errors
@validate_json(['email', 'password'])
def register(_data: dict) -> Tuple[Response, int] | Response:
    """Register a new user"""
    email = _data.get('email')
    password = _data.get('password')

    # Validate email format
    if not validate_email(email):
        return base.error_response('Invalid email format', 400)

    # Validate password strength
    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        return base.error_response(error_msg, 400)

    if db.session.execute(select(User).where(User.email == email)).scalar_one_or_none():
        return base.error_response('Email already in use', 409)

    hashed_password = generate_password_hash(password)
    new_user = User(email=email, password=hashed_password)

    new_user.profile = Profile(
        gender='',
        age=0,
        discord='',
        name='',
        preferences='',
        zodiac='',
        location='',
        nick_name='',
        bio='',
        language='',
        steam_id='',
        photo='photo1'  # Imagen por defecto
    )

    db.session.add(new_user)
    db.session.commit()

    # Token expires in 24 hours
    token = create_access_token(
        identity=str(new_user.id),
        expires_delta=timedelta(hours=24)
    )
    return jsonify({'success': True, 'token': token}), 200


@auth_bp.route('/login', methods=['POST'])
@apply_rate_limit_if_available("5 per minute")
@handle_errors
@validate_json(['email', 'password'])
def login(_data: dict) -> Tuple[Response, int] | Response:
    """Login user and return JWT token"""
    email_norm = (_data.get('email') or '').strip().lower()
    stmt = select(User).where(func.lower(User.email) == email_norm)
    user = db.session.execute(stmt).scalar_one_or_none()

    # Use generic error message to prevent email enumeration
    # Always check password hash even if user doesn't exist to prevent timing attacks
    if not user or not check_password_hash(user.password, _data['password']):
        return base.error_response('Email o contraseña incorrectos', 401)

    if (
        is_supabase_admin_configured()
        and not user.supabase_auth_id
        and os.getenv("SUPABASE_AUTO_LINK_ON_LOGIN", "").strip().lower() in ("1", "true", "yes")
    ):
        sid = find_supabase_auth_id_by_email(user.email)
        if sid:
            user.supabase_auth_id = sid
            try:
                db.session.commit()
            except Exception as ex:
                logger.debug("login: could not persist supabase_auth_id: %s", ex)
                db.session.rollback()

    # Token expires in 24 hours
    token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(hours=24)
    )
    return jsonify({'success': 'true', 'token': token}), 200


@auth_bp.route('/mailer/<address>', methods=['POST'])
def handle_mail(address: str) -> Response:
    return send_email(address)


@auth_bp.route('/token', methods=['GET'])
@jwt_required()
@handle_errors
def check_jwt() -> Tuple[Response, int]:
    """Validate JWT token and return user info"""
    user_id = get_jwt_identity()
    user, error_response = base.get_user_or_404(int(user_id))
    if error_response:
        return jsonify({'success': False, 'msg': 'Bad token'}), 401
    return jsonify({'success': True, 'user': user.serialize()}), 200


_RESET_MSG = (
    'If an account exists for that email, you will receive reset instructions shortly.'
)


@auth_bp.route("/check_mail", methods=['POST'])
@apply_rate_limit_if_available("20 per hour")
@handle_errors
@validate_json(['email'])
def check_mail(_data: dict) -> Tuple[Response, int] | Response:
    """Send password reset email (misma respuesta genérica si el correo no está registrado)."""
    raw = (_data.get('email') or '').strip()
    if not validate_email(raw):
        return base.error_response('Invalid email format', 400)

    email_norm = raw.lower()
    user = db.session.execute(
        select(User).where(func.lower(User.email) == email_norm)
    ).scalar_one_or_none()

    if not user:
        return jsonify({'success': True, 'msg': _RESET_MSG}), 200

    token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(hours=1)
    )
    if not token:
        return base.error_response('token not found', 404)

    # Enviar al correo guardado en BD (mayúsculas/minúsculas canónicas del usuario).
    result = send_email(user.email, token)
    if isinstance(result, dict) and not result.get('success'):
        logger.error("check_mail SMTP failed: %s", result.get('msg'))
        return jsonify({
            'success': False,
            'msg': (
                'No se pudo enviar el correo. Comprueba MAIL_USERNAME/MAIL_DEFAULT_SENDER, '
                'MAIL_PASSWORD (contraseña de aplicación en Gmail) y reinicia el servidor.'
            ),
        }), 502

    return jsonify({'success': True, 'msg': _RESET_MSG}), 200


@auth_bp.route('/password_update', methods=['PUT'])
@jwt_required()
@handle_errors
@validate_json(['password'])
def password_update(_data: dict) -> Tuple[Response, int]:
    """Update password (used for password reset)"""
    # Validate password strength
    is_valid, error_msg = validate_password_strength(_data['password'])
    if not is_valid:
        return jsonify({'success': False, 'msg': error_msg}), 400
    
    # extraemos el id del token que creamos en la linea 133
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'success': False, 'msg': 'Falta el id'}), 422
    
    # buscamos usuario por id
    user, error_response = base.get_user_or_404(int(user_id))
    if error_response:
        return jsonify({'success': False, 'msg': 'Falta el user'}), 422

    # actualizamos password del usuario
    hashed_password = generate_password_hash(_data['password'])
    user.password = hashed_password
    # alacenamos los cambios
    db.session.commit()

    notify = send_password_changed_notification(user.email)
    if not notify.get('success'):
        logger.warning(
            'password_update for user %s but confirmation email failed: %s',
            user.id,
            notify.get('msg'),
        )

    return jsonify({'success': True, 'msg': 'Contraseña actualizada exitosamente, intente iniciar sesion'}), 200



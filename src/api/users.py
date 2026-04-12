"""
User management endpoints
"""
import logging
from datetime import timedelta

from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import (
    create_access_token,
    decode_token,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import select, or_, func
from api.models import db, User
from api.validators import (
    validate_email,
    validate_password_strength,
    require_user_exists,
    validate_json,
    handle_errors,
    require_ownership,
)
from api.base import BaseEndpoint
from api.rate_limiter import apply_rate_limit_if_available
from api.mail.mailer import (
    send_password_changed_notification,
    send_email_change_confirmation,
    send_email_changed_alert,
)
from typing import Tuple

logger = logging.getLogger(__name__)

users_bp = Blueprint('users', __name__)
base = BaseEndpoint()


@users_bp.route('/private', methods=['GET', 'OPTIONS'])
@apply_rate_limit_if_available("200 per hour")
@handle_errors
def get_user_info() -> Tuple[Response, int] | Response:
    """Get current user info from JWT token"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    # Require JWT for actual GET requests
    from flask_jwt_extended import verify_jwt_in_request
    verify_jwt_in_request()

    user_id = get_jwt_identity()
    user, error_response = base.get_user_or_404(int(user_id))
    if error_response:
        return error_response
    return jsonify({'success': 'true', 'user': user.serialize()}), 200


@users_bp.route('/users', methods=['GET'])
def get_users() -> Tuple[Response, int]:
    stmt = select(User)
    users = db.session.execute(stmt).scalars().all()
    return jsonify([user.serialize() for user in users]), 200


@users_bp.route('/users/<int:user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def get_single_user(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get a single user by ID"""
    return base.serialize_response(_user, 200)


@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
def delete_user(user_id: int, _user: User) -> Tuple[Response, int]:
    """Delete a user account"""
    db.session.delete(_user)
    db.session.commit()
    return base.success_response(f'user {user_id} deleted', status_code=200)


@users_bp.route('/users', methods=['POST'])
@jwt_required()
def post_user() -> Tuple[Response, int]:
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing data'}), 400
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        email=data['email'],
        password=hashed_password
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.serialize()), 200


@users_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
@validate_json(['email', 'password'])
def put_user(user_id: int, _user: User, _data: dict) -> Tuple[Response, int] | Response:
    """Update a user account"""
    _user.email = _data.get('email', _user.email)
    # Hash password before storing
    if 'password' in _data and _data['password']:
        _user.password = generate_password_hash(_data['password'])
    db.session.commit()
    return base.serialize_response(_user, 200)


@users_bp.route('/users_email/confirm', methods=['POST'])
@apply_rate_limit_if_available("30 per hour")
@handle_errors
@validate_json(['token'])
def confirm_user_email(_data: dict) -> Tuple[Response, int] | Response:
    """Aplica el cambio de email tras abrir el enlace del correo nuevo (sin JWT de sesión)."""
    token = (_data.get('token') or '').strip()
    try:
        decoded = decode_token(token)
    except Exception as e:
        logger.info('confirm_user_email: invalid token: %s', e)
        return base.error_response('Invalid or expired link', 401)

    if decoded.get('scope') != 'email_change_confirm':
        return base.error_response('Invalid or expired link', 401)

    uid = int(decoded['sub'])
    user = db.session.get(User, uid)
    if not user or not user.pending_email:
        return base.error_response('Invalid or expired link', 400)

    new_final = user.pending_email.strip().lower()
    if not validate_email(new_final):
        return base.error_response('Invalid pending email', 400)

    other = db.session.execute(
        select(User).where(
            User.id != uid,
            or_(
                func.lower(User.email) == new_final,
                func.lower(User.pending_email) == new_final,
            ),
        )
    ).scalar_one_or_none()
    if other:
        return base.error_response('that email already exists', 409)

    old_email = user.email
    user.email = new_final
    user.pending_email = None
    db.session.commit()

    alert = send_email_changed_alert(old_email, new_final)
    if not alert.get('success'):
        logger.warning(
            'email changed alert to %s failed: %s',
            old_email,
            alert.get('msg'),
        )

    return jsonify({
        'success': True,
        'msg': 'Email updated successfully.',
        'email': new_final,
    }), 200


@users_bp.route('/users_email/<int:user_id>', methods=['PUT'])
@apply_rate_limit_if_available("10 per hour")
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
@validate_json(['email', 'currentPassword'])
def put_user_email(user_id: int, _user: User, _data: dict) -> Tuple[Response, int] | Response:
    """
    Solicita cambio de email: exige contraseña actual, guarda pending_email y envía
    enlace de confirmación al nuevo buzón.
    """
    raw_new = (_data.get('email') or '').strip()
    if not validate_email(raw_new):
        return base.error_response('Invalid email format', 400)

    new_norm = raw_new.lower()

    if not check_password_hash(_user.password, _data.get('currentPassword') or ''):
        return base.error_response('Contraseña actual incorrecta', 401)

    if new_norm == (_user.email or '').strip().lower():
        return base.error_response(
            'The new email must be different from the current one',
            400,
        )

    conflict = db.session.execute(
        select(User).where(
            User.id != user_id,
            or_(
                func.lower(User.email) == new_norm,
                func.lower(User.pending_email) == new_norm,
            ),
        )
    ).scalar_one_or_none()
    if conflict is not None:
        return base.error_response('that email already exists', 400)

    _user.pending_email = new_norm
    db.session.commit()

    token = create_access_token(
        identity=str(_user.id),
        expires_delta=timedelta(hours=24),
        additional_claims={'scope': 'email_change_confirm'},
    )
    send_result = send_email_change_confirmation(new_norm, token)
    if not send_result.get('success'):
        _user.pending_email = None
        db.session.commit()
        logger.error(
            'email change confirmation send failed: %s',
            send_result.get('msg'),
        )
        return base.error_response(
            'Could not send confirmation email. Check SMTP configuration.',
            502,
        )

    return jsonify({
        'success': True,
        'msg': 'Check your new inbox to confirm the change.',
        'pending_email': new_norm,
    }), 200


@users_bp.route('/users_password/<int:user_id>', methods=['PUT'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
@validate_json(['password', 'actualPassword'])
def users_password(user_id: int, _user: User, _data: dict) -> Tuple[Response, int]:
    """Update user password"""
    # Verify current password
    if not check_password_hash(_user.password, _data['actualPassword']):
        return base.error_response('Contraseña actual incorrecta', 401)

    # Validate password strength
    is_valid, error_msg = validate_password_strength(_data['password'])
    if not is_valid:
        return base.error_response(error_msg, 400)

    _user.password = generate_password_hash(_data['password'])
    db.session.commit()

    notify = send_password_changed_notification(_user.email)
    if not notify.get('success'):
        logger.warning(
            'Password updated for user %s but confirmation email failed: %s',
            _user.id,
            notify.get('msg'),
        )

    return base.success_response('Contraseña actualizada correctamente', status_code=200)

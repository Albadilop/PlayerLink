"""
User management endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import select
from api.models import db, User
from api.validators import (
    validate_email,
    validate_password_strength,
    verify_ownership,
    require_user_exists,
    validate_json,
    handle_errors,
    require_ownership,
)
from api.base import BaseEndpoint
from api.rate_limiter import apply_rate_limit_if_available
from typing import Tuple

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


@users_bp.route('/users_email/<int:user_id>', methods=['PUT'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
@validate_json(['email'])
def put_user_email(user_id: int, _user: User, _data: dict) -> Tuple[Response, int] | Response:
    """Update user email"""
    # Validate email format
    if not validate_email(_data['email']):
        return base.error_response('Invalid email format', 400)
    
    # Check if email already exists
    emailstmt = select(User).where(User.email == _data['email'])
    existingEmail = db.session.execute(emailstmt).scalar_one_or_none()

    if existingEmail is not None and existingEmail.id != user_id:
        return base.error_response('that email already exists', 400)

    _user.email = _data.get('email', _user.email)
    db.session.commit()
    return base.serialize_response(_user, 200)


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

    return base.success_response('Contraseña actualizada correctamente', status_code=200)


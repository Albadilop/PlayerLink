"""
User management endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import select
from api.models import db, User
from api.validators import validate_email, validate_password_strength, verify_ownership
from api.rate_limiter import apply_rate_limit_if_available
from typing import Tuple

users_bp = Blueprint('users', __name__)


@users_bp.route('/private', methods=['GET', 'OPTIONS'])
@apply_rate_limit_if_available("200 per hour")
def get_user_info() -> Tuple[Response, int] | Response:
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    # Require JWT for actual GET requests
    from flask_jwt_extended import verify_jwt_in_request
    verify_jwt_in_request()
    
    id = get_jwt_identity()
    stmt = select(User).where(User.id == id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': 'user not finded'})
    return jsonify({'success': 'true', 'user': user.serialize()})


@users_bp.route('/users', methods=['GET'])
def get_users() -> Tuple[Response, int]:
    stmt = select(User)
    users = db.session.execute(stmt).scalars().all()
    return jsonify([user.serialize() for user in users]), 200


@users_bp.route('/users/<int:user_id>', methods=['GET'])
def get_single_user(user_id: int) -> Tuple[Response, int]:
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'user whit id: {user_id} not found'}), 414
    return jsonify(user.serialize()), 200


@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    if not verify_ownership(current_user_id, user_id):
        return jsonify({'error': 'Unauthorized: You can only delete your own account'}), 403
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'user whit id: {user_id} not found'}), 414
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f'user {user_id} deleted'}), 200


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
def put_user(user_id: int) -> Tuple[Response, int] | Response:
    current_user_id = get_jwt_identity()
    if not verify_ownership(current_user_id, user_id):
        return jsonify({'error': 'Unauthorized: You can only modify your own account'}), 403
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing data'}), 400
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'})
    user.email = data.get('email', user.email)
    # Hash password before storing
    if 'password' in data and data['password']:
        user.password = generate_password_hash(data['password'])
    db.session.commit()
    return jsonify(user.serialize()), 200


@users_bp.route('/users_email/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_user_email(user_id: int) -> Tuple[Response, int] | Response:
    current_user_id = get_jwt_identity()
    if not verify_ownership(current_user_id, user_id):
        return jsonify({'error': 'Unauthorized: You can only modify your own email'}), 403
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Missing data'}), 400
    
    # Validate email format
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    emailstmt = select(User).where(User.email == data['email'])
    existingEmail = db.session.execute(emailstmt).scalar_one_or_none()

    if existingEmail is not None:
        return jsonify({'error':'that email already exists'}), 400

    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'})
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify(user.serialize()), 200


@users_bp.route('/users_password/<int:user_id>', methods=['PUT'])
@jwt_required()
def users_password(user_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    if not verify_ownership(current_user_id, user_id):
        return jsonify({'error': 'Unauthorized: You can only change your own password'}), 403
    data = request.get_json()
    required_fields = ['password', 'actualPassword']

    if not data or not all(field in data and data[field] for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos'}), 400

    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()

    if user is None:
        return jsonify({'error': f'Usuario con id {user_id} no encontrado'}), 404

    if not check_password_hash(user.password, data['actualPassword']):
        return jsonify({'error': 'Contraseña actual incorrecta'}), 401

    # Validate password strength
    is_valid, error_msg = validate_password_strength(data['password'])
    if not is_valid:
        return jsonify({'error': error_msg}), 400

    user.password = generate_password_hash(data['password'])
    db.session.commit()

    return jsonify({'msg': 'Contraseña actualizada correctamente'}), 200


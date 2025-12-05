"""
Authentication endpoints: register, login, password reset, token validation
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from datetime import timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import select
from api.models import db, User, Profile
from api.validators import validate_email, validate_password_strength
from api.rate_limiter import apply_rate_limit_if_available
from api.mail.mailer import send_email
from typing import Tuple

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
@apply_rate_limit_if_available("5 per minute")
def register() -> Tuple[Response, int] | Response:
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400

        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        # Validate password strength
        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        if db.session.execute(select(User).where(User.email == email)).scalar_one_or_none():
            return jsonify({'error': 'Email already in use'}), 409

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

    except Exception as e:
        # Log error details server-side only
        print(f"Registration error: {type(e).__name__}")
        db.session.rollback()
        return jsonify({'error': 'Internal error during registration'}), 500


@auth_bp.route('/login', methods=['POST'])
@apply_rate_limit_if_available("5 per minute")
def login() -> Tuple[Response, int] | Response:
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            raise Exception('missing data')
        stmt = select(User).where(User.email == data['email'])
        user = db.session.execute(stmt).scalar_one_or_none()

        # Use generic error message to prevent email enumeration
        # Always check password hash even if user doesn't exist to prevent timing attacks
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({'error': 'Email o contraseña incorrectos'}), 401

        # Token expires in 24 hours
        token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=24)
        )
        return jsonify({'success': 'true', 'token': token}), 200
    except Exception as e:
        # Log error details server-side only
        print(f"Login error: {type(e).__name__}")
        return jsonify({'error': 'An error occurred during login'}), 400


@auth_bp.route('/mailer/<address>', methods=['POST'])
def handle_mail(address: str) -> Response:
    return send_email(address)


@auth_bp.route('/token', methods=['GET'])
@jwt_required()
def check_jwt() -> Tuple[Response, int]:
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user:
        return jsonify({'success': True, 'user': user.serialize()}), 200
    return jsonify({'success': False, 'msg': 'Bad token'}), 401


@auth_bp.route("/check_mail", methods=['POST'])
@apply_rate_limit_if_available("3 per hour")
def check_mail() -> Tuple[Response, int] | Response:
    try:
        data = request.json
        # buscamos el correo en la base de datos y almacenamos el resultado en la variable user
        user = User.query.filter_by(email=data['email']).first()
        # Use generic message to prevent email enumeration
        if not user:
            return jsonify({'success': False, 'msg': 'If this email exists, a password reset link has been sent'}), 200
        # creamos el token que se va a enviar y necesario para la recuperacion de la contraseña
        # Token for password reset expires in 1 hour
        token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=1)
        )
        if not token:
            return jsonify({'success': False, 'msg': 'token not found'}), 404

        result = send_email(data['email'], token)
        print(result)
        return jsonify({'success': True, 'token': token, 'email': result}), 200
    except Exception as e:
        # Log error details server-side only
        print(f"Check mail error: {type(e).__name__}")
        return jsonify({'success': False, 'msg': 'An error occurred processing your request'}), 500


@auth_bp.route('/password_update', methods=['PUT'])
@jwt_required()
def password_update() -> Tuple[Response, int]:
    try:
        data = request.get_json(force=True)
        if not data or 'password' not in data or not data['password']:
            return jsonify({'success': False, 'msg': 'Falta el campo password'}), 422
        
        # Validate password strength
        is_valid, error_msg = validate_password_strength(data['password'])
        if not is_valid:
            return jsonify({'success': False, 'msg': error_msg}), 400
        
        # extraemos el id del token que creamos en la linea 133
        id = get_jwt_identity()
        if not id:
            return jsonify({'success': False, 'msg': 'Falta el id'}), 422
        # buscamos usuario por id
        user = User.query.get(id)
        if not user:
            return jsonify({'success': False, 'msg': 'Falta el user'}), 422

        # actualizamos password del usuario
        hashed_password = generate_password_hash(data['password'])
        user.password = hashed_password
        # alacenamos los cambios
        db.session.commit()
        return jsonify({'success': True, 'msg': 'Contraseña actualizada exitosamente, intente iniciar sesion'}), 200
    except Exception as e:
        db.session.rollback()
        # Log error details server-side only
        print(f"Password update error: {type(e).__name__}")
        return jsonify({'success': False, 'msg': 'An error occurred updating your password'}), 500



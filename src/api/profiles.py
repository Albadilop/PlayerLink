"""
Profile management endpoints
"""
import os
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select, not_
from api.models import db, User, Profile
from api.validators import (
    verify_ownership,
    require_user_exists,
    require_profile_exists,
    validate_json,
    handle_errors,
    require_ownership,
    validate_image_file
)
from api.base import BaseEndpoint
from typing import Tuple

profiles_bp = Blueprint('profiles', __name__)
base = BaseEndpoint()


def is_profile_complete(profile: Profile) -> tuple[bool, list[str]]:
    """
    Check if a profile has all required fields completed.
    
    Required fields:
    - name (minimum 2 characters)
    - nick_name (minimum 2 characters)
    - age (must be >= 18)
    - gender (minimum 2 characters)
    - location (minimum 2 characters)
    - At least 1 game in games list
    
    Returns:
        Tuple of (is_complete: bool, missing_fields: list[str])
    """
    missing_fields = []
    
    # Validate name
    if not profile.name or len(profile.name.strip()) < 2:
        missing_fields.append('name')
    
    # Validate nick_name
    if not profile.nick_name or len(profile.nick_name.strip()) < 2:
        missing_fields.append('nick_name')
    
    # Validate age
    if not profile.age or profile.age < 18:
        missing_fields.append('age')
    
    # Validate gender
    if not profile.gender or len(profile.gender.strip()) < 2:
        missing_fields.append('gender')
    
    # Validate location
    if not profile.location or len(profile.location.strip()) < 2:
        missing_fields.append('location')
    
    # Validate at least 1 game
    if not profile.games or len(profile.games) == 0:
        missing_fields.append('games')
    
    return len(missing_fields) == 0, missing_fields


@profiles_bp.route('/profiles', methods=['GET'])
def get_profiles() -> Tuple[Response, int]:
    stmt = select(Profile)
    profiles = db.session.execute(stmt).scalars().all()
    return jsonify([profile.serialize() for profile in profiles]), 200


@profiles_bp.route('/profiles/user/<int:user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def get_single_profile_by_user(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get profile by user ID"""
    profile, error_response = base.get_profile_or_404(user_id)
    if error_response:
        return error_response
    return base.serialize_response(profile, 200)


@profiles_bp.route('/profiles/<int:profile_id>', methods=['GET'])
def get_single_profile(profile_id: int) -> Tuple[Response, int]:
    stmt = select(Profile).where(Profile.id == profile_id)
    profile = db.session.execute(stmt).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'the profile with id: {profile_id} not found'}), 414
    return jsonify(profile.serialize()), 200


@profiles_bp.route('/profiles/user/<int:user_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
def delete_profile_by_user_id(user_id: int, _user: User) -> Tuple[Response, int] | Response:
    """Delete profile by user ID"""
    profile, error_response = base.get_profile_or_404(user_id)
    if error_response:
        return error_response
    db.session.delete(profile)
    db.session.commit()
    return base.success_response(f'profile of user with id: {user_id} deleted', status_code=200)


@profiles_bp.route('/profiles/<int:profile_id>', methods=['DELETE'])
@jwt_required()
def delete_profile(profile_id: int) -> Tuple[Response, int] | Response:
    stmt = select(Profile).where(Profile.id == profile_id)
    profile = db.session.execute(stmt).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'the profile with id: {profile_id} not found'}), 414
    db.session.delete(profile)
    db.session.commit()
    return jsonify({'message': f'profile with id: {profile_id} deleted'})


@profiles_bp.route('/profiles/<int:user_id>', methods=['POST'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
@validate_json()
def post_profile(user_id: int, _user: User, _data: dict) -> Tuple[Response, int]:
    """Create a new profile for a user"""
    if _user.profile:
        return base.error_response('this profile already exist, please try to modify it insted of create a new one', 400)
    
    new_profile = Profile(
        gender=_data.get('gender') or 'Undefinied',
        age=_data.get('age') or 0,
        discord=_data.get('discord') or 'Undefinied',
        name=_data.get('name') or 'Undefinied',
        preferences=_data.get('preferences') or 'Undefinied',
        zodiac=_data.get('zodiac') or 'Undefinied',
        location=_data.get('location') or 'Undefinied',
        nick_name=_data.get('nick_name') or 'Undefinied',
        bio=_data.get('bio') or 'Undefinied',
        language=_data.get('language') or 'Undefinied',
        steam_id=_data.get('steam_id') or 'Undefinied',
        photo=_data.get('photo') or 'Undefinied'
    )
    _user.profile = new_profile
    db.session.commit()
    return base.serialize_response(_user.profile, 200)


@profiles_bp.route('/profiles/<int:user_id>', methods=['PUT'])
@jwt_required()
@handle_errors
@require_profile_exists('user_id')
@require_ownership
@validate_json()
def put_profile(user_id: int, _user: User, _profile: Profile, _data: dict) -> Tuple[Response, int]:
    """Update an existing profile"""
    _profile.gender = _data.get('gender', _profile.gender)
    _profile.preferences = _data.get('preferences', _profile.preferences)
    _profile.zodiac = _data.get('zodiac', _profile.zodiac)
    _profile.discord = _data.get('discord', _profile.discord)
    _profile.age = _data.get('age', _profile.age)
    _profile.name = _data.get('name', _profile.name)
    _profile.location = _data.get('location', _profile.location)
    _profile.nick_name = _data.get('nick_name', _profile.nick_name)
    _profile.bio = _data.get('bio', _profile.bio)
    _profile.language = _data.get('languages', _profile.language)
    _profile.steam_id = _data.get('steam_id', _profile.steam_id)
    _profile.photo = _data.get('photo', _profile.photo)

    db.session.commit()
    return base.serialize_response(_profile, 200)


@profiles_bp.route('/profiles/profiles_to_explore/<int:user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def profiles_to_explore(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get profiles available for exploration (excluding already liked/rejected)"""
    # Obtener los IDs de usuarios a los que ya le dio like
    liked_user_ids = [like.liked_id for like in _user.likes_given]

    # Obtener los IDs de usuarios a los que ya le dio reject
    rejected_user_ids = [reject.rejected_id for reject in _user.rejects_given]

    # IDs a excluir
    exclude_ids = set(liked_user_ids + rejected_user_ids + [user_id])

    # Buscar usuarios que no estén en exclude_ids y que tengan perfil
    profiles = (
        db.session.query(Profile)
        .join(User)
        .filter(not_(User.id.in_(exclude_ids)))
        .all()
    )

    # Serializar perfiles
    result = [profile.serialize() for profile in profiles]

    return jsonify({"profiles": result}), 200


@profiles_bp.route('/profiles/photo/<int:user_id>', methods=['PUT'])
@jwt_required()
@handle_errors
@require_profile_exists('user_id')
@require_ownership
@validate_json(['photo'])
def put_profilephoto(user_id: int, _user: User, _profile: Profile, _data: dict) -> Tuple[Response, int]:
    """Update profile photo"""
    _profile.photo = _data.get('photo', _profile.photo)
    db.session.commit()
    return base.serialize_response(_profile, 200)


@profiles_bp.route('/profiles/photo/upload/<int:user_id>', methods=['POST'])
@jwt_required()
@handle_errors
@require_profile_exists('user_id')
@require_ownership
def upload_profile_photo(user_id: int, _user: User, _profile: Profile) -> Tuple[Response, int]:
    """Upload a profile photo file with strict validation"""
    if 'photo' not in request.files:
        return base.error_response('No file provided', 400)
    
    file = request.files['photo']
    if file.filename == '':
        return base.error_response('No file selected', 400)
    
    # Validación robusta de la imagen
    is_valid, error_message = validate_image_file(
        file, 
        max_size_mb=5, 
        max_width=2000, 
        max_height=2000
    )
    
    if not is_valid:
        return base.error_response(error_message or 'Invalid image file', 400)
    
    # Obtener extensión del archivo después de validación
    filename = secure_filename(file.filename)
    file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    # Crear directorio de uploads si no existe
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'profiles')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Eliminar foto anterior si existe y es una foto subida
    if _profile.photo and _profile.photo.startswith('uploaded_'):
        old_filename = _profile.photo.replace('uploaded_', '')
        old_filepath = os.path.join(upload_dir, old_filename)
        if os.path.exists(old_filepath):
            try:
                os.remove(old_filepath)
            except Exception:
                pass  # Ignorar errores al eliminar archivo antiguo
    
    # Generar nombre único para el archivo
    import time
    timestamp = int(time.time())
    unique_filename = f"user_{user_id}_photo_{timestamp}.{file_ext}"
    filepath = os.path.join(upload_dir, unique_filename)
    
    # Guardar el archivo
    try:
        file.save(filepath)
        
        # Actualizar el perfil con el nombre del archivo
        # Usamos un prefijo especial para identificar fotos subidas
        photo_key = f"uploaded_{unique_filename}"
        _profile.photo = photo_key
        db.session.commit()
        
        return jsonify({
            'success': True,
            'photo': photo_key,
            'message': 'Photo uploaded successfully'
        }), 200
    except Exception as e:
        return base.error_response(f'Error saving file: {str(e)}', 500)


@profiles_bp.route('/profiles/photo/<path:filename>', methods=['GET'])
def get_uploaded_photo(filename: str) -> Tuple[Response, int]:
    """Serve uploaded profile photos"""
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'profiles')
    filepath = os.path.join(upload_dir, secure_filename(filename))
    
    # Verificar que el archivo existe y está dentro del directorio de uploads
    if not os.path.exists(filepath) or not filepath.startswith(upload_dir):
        return base.error_response('Photo not found', 404)
    
    from flask import send_from_directory
    return send_from_directory(upload_dir, secure_filename(filename)), 200


@profiles_bp.route('/profiles/check-completion/<int:user_id>', methods=['GET'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
def check_profile_completion(user_id: int, _user: User) -> Tuple[Response, int]:
    """Check if a user's profile is complete with all required fields"""
    if not _user.profile:
        return jsonify({
            'is_complete': False,
            'missing_fields': ['profile'],
            'message': 'Profile does not exist'
        }), 200
    
    is_complete, missing_fields = is_profile_complete(_user.profile)
    
    return jsonify({
        'is_complete': is_complete,
        'missing_fields': missing_fields,
        'message': 'Profile is complete' if is_complete else 'Profile is incomplete'
    }), 200



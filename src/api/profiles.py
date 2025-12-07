"""
Profile management endpoints
"""
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
    require_ownership
)
from api.base import BaseEndpoint
from typing import Tuple

profiles_bp = Blueprint('profiles', __name__)
base = BaseEndpoint()


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



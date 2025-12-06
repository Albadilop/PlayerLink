"""
Profile management endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select, not_
from api.models import db, User, Profile
from api.validators import verify_ownership
from typing import Tuple

profiles_bp = Blueprint('profiles', __name__)


@profiles_bp.route('/profiles', methods=['GET'])
def get_profiles() -> Tuple[Response, int]:
    stmt = select(Profile)
    profiles = db.session.execute(stmt).scalars().all()
    return jsonify([profile.serialize() for profile in profiles]), 200


@profiles_bp.route('/profiles/user/<int:user_id>', methods=['GET'])
def get_single_profile_by_user(user_id: int) -> Tuple[Response, int]:
    stmt = select(Profile).where(Profile.user_id == user_id)
    profile = db.session.execute(stmt).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'the profile of the user with id: {user_id} not found'}), 414
    return jsonify(profile.serialize()), 200


@profiles_bp.route('/profiles/<int:profile_id>', methods=['GET'])
def get_single_profile(profile_id: int) -> Tuple[Response, int]:
    stmt = select(Profile).where(Profile.id == profile_id)
    profile = db.session.execute(stmt).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'the profile with id: {profile_id} not found'}), 414
    return jsonify(profile.serialize()), 200


@profiles_bp.route('/profiles/user/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_profile_by_user_id(user_id: int) -> Tuple[Response, int] | Response:
    current_user_id = get_jwt_identity()
    if not verify_ownership(current_user_id, user_id):
        return jsonify({'error': 'Unauthorized: You can only delete your own profile'}), 403
    stmt = select(Profile).where(Profile.user_id == user_id)
    profile = db.session.execute(stmt).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'the profile of the user with id: {user_id} not found'}), 414
    db.session.delete(profile)
    db.session.commit()
    return jsonify({'message': f'profile of user with id: {user_id} deleted'})


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
def post_profile(user_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    if not verify_ownership(current_user_id, user_id):
        return jsonify({'error': 'Unauthorized: You can only create your own profile'}), 403
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'}), 400
    if user.profile:
        return jsonify({'error': 'this profile already exist, please try to modify it insted of create a new one'}), 400
    new_profile = Profile(
        gender=data.get('gender') or 'Undefinied',
        age=data.get('age') or 0,
        discord=data.get('discord') or 'Undefinied',
        name=data.get('name') or 'Undefinied',
        preferences=data.get('preferences') or 'Undefinied',
        zodiac=data.get('zodiac') or 'Undefinied',
        location=data.get('location') or 'Undefinied',
        nick_name=data.get('nick_name') or 'Undefinied',
        bio=data.get('bio') or 'Undefinied',
        language=data.get('language') or 'Undefinied',
        steam_id=data.get('steam_id') or 'Undefinied',
        photo=data.get('photo') or 'Undefinied'
    )
    user.profile = new_profile
    db.session.commit()
    return jsonify(user.profile.serialize()), 200


@profiles_bp.route('/profiles/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_profile(user_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    if not verify_ownership(current_user_id, user_id):
        return jsonify({'error': 'Unauthorized: You can only modify your own profile'}), 403
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'}), 400
    if not user.profile:
        return jsonify({'error': 'this profile do not  exist, please try to create it insted of modify one'}), 400

    user.profile.gender = data.get('gender', user.profile.gender)
    user.profile.preferences = data.get('preferences', user.profile.preferences)
    user.profile.zodiac = data.get('zodiac', user.profile.zodiac)
    user.profile.discord = data.get('discord', user.profile.discord)
    user.profile.age = data.get('age', user.profile.age)
    user.profile.name = data.get('name', user.profile.name)
    user.profile.location = data.get('location', user.profile.location)
    user.profile.nick_name = data.get('nick_name', user.profile.nick_name)
    user.profile.bio = data.get('bio', user.profile.bio)
    user.profile.language = data.get('languages', user.profile.language)
    user.profile.steam_id = data.get('steam_id', user.profile.steam_id)
    user.profile.photo = data.get('photo', user.profile.photo)

    db.session.commit()
    return jsonify(user.profile.serialize()), 200


@profiles_bp.route('/profiles/profiles_to_explore/<int:user_id>', methods=['GET'])
def profiles_to_explore(user_id: int) -> Tuple[Response, int]:
    # Verificar que el usuario existe
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': f'User with id {user_id} not found'}), 404

    # Obtener los IDs de usuarios a los que ya le dio like
    liked_user_ids = [like.liked_id for like in user.likes_given]

    # Obtener los IDs de usuarios a los que ya le dio reject
    rejected_user_ids = [reject.rejected_id for reject in user.rejects_given]

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
def put_profilephoto(user_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    if not verify_ownership(current_user_id, user_id):
        return jsonify({'error': 'Unauthorized: You can only modify your own profile photo'}), 403
    data = request.get_json()
    if not data or 'photo' not in data:
        return jsonify({'error': 'Missing data'}), 400
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'}), 400
    if not user.profile:
        return jsonify({'error': 'this profile do not  exist, please try to create it insted of modify one'}), 400

    user.profile.photo = data.get('photo', user.profile.photo)

    db.session.commit()
    return jsonify(user.profile.serialize()), 200



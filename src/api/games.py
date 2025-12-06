"""
Game management endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select
from api.models import db, Game, Profile
from api.validators import (
    verify_ownership,
    require_user_exists,
    require_profile_exists,
    validate_json,
    handle_errors,
)
from api.base import BaseEndpoint
from typing import Tuple

games_bp = Blueprint('games', __name__)
base = BaseEndpoint()


@games_bp.route('/games', methods=['GET'])
def get_all_games() -> Tuple[Response, int]:
    stmt = select(Game)
    games = db.session.execute(stmt).scalars().all()
    return jsonify([game.serialize() for game in games]), 200


@games_bp.route('/games/<int:game_id>', methods=['GET'])
@handle_errors
def get_single_game(game_id: int) -> Tuple[Response, int] | Response:
    """Get a single game by ID"""
    game = db.session.get(Game, game_id)
    if game is None:
        return base.error_response('this game does not exist', 404)
    return base.serialize_response(game, 200)


@games_bp.route('/games_by_profile/<int:profile_id>', methods=['GET'])
@handle_errors
def get_games_by_profile_id(profile_id: int) -> Tuple[Response, int]:
    """Get all games for a specific profile"""
    profile = db.session.get(Profile, profile_id)
    if profile is None:
        return base.error_response('Profile not found', 404)
    
    stmt = select(Game).where(Game.profile_id == profile_id)
    games = db.session.execute(stmt).scalars().all()

    if not games:
        return base.error_response('No se han encontrado juegos para este perfil', 404)

    serialized = [game.serialize() for game in games]
    return jsonify(serialized), 200


@games_bp.route('/games/hours/<int:game_id>', methods=['PUT'])
@jwt_required()
@handle_errors
@validate_json()
def put_game_hours(game_id: int, _data: dict) -> Tuple[Response, int]:
    """Update game hours"""
    current_user_id = get_jwt_identity()
    game = db.session.get(Game, game_id)
    
    if game is None:
        return base.error_response('Este juego no existe', 404)
    
    # Verify that the game belongs to the authenticated user's profile
    profile = db.session.get(Profile, game.profile_id)
    if not profile:
        return base.error_response('Profile not found', 404)
    
    ownership_error = base.validate_ownership(current_user_id, profile.user_id)
    if ownership_error:
        return ownership_error

    # Actualizar los valores
    game.game_hoursPlayed = _data.get("hours_played") or 'undefined'
    db.session.commit()

    return base.serialize_response(game, 200)


@games_bp.route('/games/<profile_id>', methods=['POST'])
@jwt_required()
@handle_errors
@validate_json(['title', 'hours_played'])
def post_game(profile_id: int, _data: dict) -> Tuple[Response, int]:
    """Create a new game for a profile"""
    current_user_id = get_jwt_identity()
    profile = db.session.get(Profile, profile_id)
    
    if not profile:
        return base.error_response('Profile not found', 404)
    
    ownership_error = base.validate_ownership(current_user_id, profile.user_id)
    if ownership_error:
        return ownership_error

    # Crear y persistir la nueva partida
    new_game = Game(
        profile_id=profile_id,
        game_hoursPlayed=_data.get('hours_played') or 'undefined',
        game_image=_data.get('image') or 'undefined',
        game_title=_data.get('title') or 'undefined'
    )
    db.session.add(new_game)
    db.session.commit()

    return base.serialize_response(new_game, 201)


@games_bp.route('/games/<game_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_game(game_id: int) -> Tuple[Response, int]:
    """Delete a game"""
    current_user_id = get_jwt_identity()
    game = db.session.get(Game, game_id)
    
    if game is None:
        return base.error_response(f'game with id: {game_id} not found', 404)
    
    # Verify that the game belongs to the authenticated user's profile
    profile = db.session.get(Profile, game.profile_id)
    if not profile:
        return base.error_response('Profile not found', 404)
    
    ownership_error = base.validate_ownership(current_user_id, profile.user_id)
    if ownership_error:
        return ownership_error

    db.session.delete(game)
    db.session.commit()
    return base.success_response(f'game with id: {game_id} deleted', status_code=200)



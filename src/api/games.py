"""
Game management endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select
from api.models import db, Game, Profile
from api.validators import verify_ownership
from typing import Tuple

games_bp = Blueprint('games', __name__)


@games_bp.route('/games', methods=['GET'])
def get_all_games() -> Tuple[Response, int]:
    stmt = select(Game)
    games = db.session.execute(stmt).scalars().all()
    return jsonify([game.serialize() for game in games]), 200


@games_bp.route('/games/<int:game_id>', methods=['GET'])
def get_single_game(game_id: int) -> Tuple[Response, int] | Response:
    stmt = select(Game).where(Game.id == game_id)
    games = db.session.execute(stmt).scalar_one_or_none()
    if games is None:
        return jsonify({'error': 'this game does not exist'})
    return jsonify(games.serialize()), 200


@games_bp.route('/games_by_profile/<int:profile_id>', methods=['GET'])
def get_games_by_profile_id(profile_id: int) -> Tuple[Response, int]:
    # 1. Ejecutar la consulta
    stmt = select(Game).where(Game.profile_id == profile_id)
    games = db.session.execute(stmt).scalars().all()

    # 2. Si no hay resultados, podemos devolver 404 o una lista vacía.
    if not games:
        return jsonify({'error': 'No se han encontrado juegos para este perfil'}), 404

    # 3. Serializar y devolver la lista
    serialized = [game.serialize() for game in games]
    return jsonify(serialized), 200


@games_bp.route('/games/hours/<int:game_id>', methods=['PUT'])
@jwt_required()
def put_game_hours(game_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No se están enviando los datos correctamente'}), 400

    # Buscar juego
    stmt = select(Game).where(Game.id == game_id)
    game = db.session.execute(stmt).scalar_one_or_none()

    if game is None:
        return jsonify({'error': 'Este juego no existe'}), 404
    
    # Verify that the game belongs to the authenticated user's profile
    profile = db.session.get(Profile, game.profile_id)
    if not profile or not verify_ownership(current_user_id, profile.user_id):
        return jsonify({'error': 'Unauthorized: You can only modify games in your own profile'}), 403

    # Actualizar los valores
    game.game_hoursPlayed = data.get("hours_played") or 'undefined'

    # Guardar cambios
    db.session.commit()

    return jsonify(game.serialize()), 200


@games_bp.route('/games/<profile_id>', methods=['POST'])
@jwt_required()
def post_game(profile_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    # Verify that the profile belongs to the authenticated user
    profile = db.session.get(Profile, profile_id)
    if not profile or not verify_ownership(current_user_id, profile.user_id):
        return jsonify({'error': 'Unauthorized: You can only add games to your own profile'}), 403
    # 1) Asegurarnos de que el Content-Type sea application/json
    if not request.is_json:
        return jsonify({'error': 'Se requiere Content-Type: application/json'}), 400

    data = request.get_json()

    # 2) Validar que venga la clave "game"
    if not data:
        return jsonify({'error': 'Falta el campo "game" en el JSON'}), 400

    # 4) Crear y persistir la nueva partida
    new_game = Game(
        profile_id=profile_id,
        game_hoursPlayed=data['hours_played'] or 'undefined',
        game_image=data['image'] or 'undefined',
        game_title=data['title'] or 'undefined'
    )
    db.session.add(new_game)
    db.session.commit()

    return jsonify(new_game.serialize()), 201


@games_bp.route('/games/<game_id>', methods=['DELETE'])
@jwt_required()
def delete_game(game_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    stmt = select(Game).where(Game.id == game_id)
    game = db.session.execute(stmt).scalar_one_or_none()
    if game is None:
        return jsonify({'error': f'game with id: {game_id} not found'}), 400
    
    # Verify that the game belongs to the authenticated user's profile
    profile = db.session.get(Profile, game.profile_id)
    if not profile or not verify_ownership(current_user_id, profile.user_id):
        return jsonify({'error': 'Unauthorized: You can only delete games from your own profile'}), 403

    db.session.delete(game)
    db.session.commit()
    return jsonify({'message': f'game with id: {game_id} deleted'}), 200



"""
Match, Like, and Reject management endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select, or_
from api.models import db, Match, Reject, Like, User
from api.validators import (
    verify_ownership,
    require_user_exists,
    handle_errors,
)
from api.base import BaseEndpoint
from typing import Tuple

matches_bp = Blueprint('matches', __name__)
base = BaseEndpoint()


# ========== MATCHES ==========

@matches_bp.route('/matches', methods=['GET'])
def get_all_matches() -> Tuple[Response, int]:
    stmt = select(Match)
    matches = db.session.execute(stmt).scalars().all()
    return jsonify([match.serialize() for match in matches]), 200


@matches_bp.route('/matches/<int:match_id>', methods=['GET'])
@handle_errors
def get_single_match(match_id: int) -> Tuple[Response, int]:
    """Get a single match by ID"""
    match = db.session.get(Match, match_id)
    if not match:
        return base.error_response(f'Match with id {match_id} not found', 404)
    return base.serialize_response(match, 200)


@matches_bp.route('/matches/user/<int:user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def get_matches_for_user(user_id: int, _user: User) -> Tuple[Response, int]:
    # 1) Sacar todos los Match donde aparezca este usuario como user1 o como user2
    stmt = select(Match).where(
        or_(
            Match.user1_id == user_id,
            Match.user2_id == user_id
        )
    )
    matches = db.session.execute(stmt).scalars().all()

    # 2) Para cada match, quedarnos solo con el "otro" usuario,
    #    serializar sus datos si tiene Profile, o "user has no data" en caso contrario.
    other_users = []
    for m in matches:
        # Determinar cuál es el usuario contrario al pasado en la URL
        if m.user1_id == user_id:
            u = m.user2
        else:
            u = m.user1

        # Si el User tiene Profile, devolvemos un dict similar al de Match.serialize() pero solo con ese user
        if u.profile:
            other_users.append({
                "user_id":   u.id,
                "nickname":  u.profile.name if u.profile.name else "undefined",
                "games":     [g.serialize() for g in u.profile.games] if u.profile.games else [],
                "gender":    u.profile.gender if u.profile.gender else "undefined",
                "age": u.profile.age if u.profile.age else "undefinied",
                "location": u.profile.location if u.profile.location else "undefinied"
            })
        else:
            other_users.append(f" user with id {u.id} has no data")

    # 3) (Opcional) Eliminar duplicados por user_id, si no quieres que el mismo usuario aparezca varias veces:
    unique_dict = {}
    deduped = []
    for item in other_users:
        if isinstance(item, dict):
            uid = item["user_id"]
            if uid not in unique_dict:
                unique_dict[uid] = item
                deduped.append(item)
        else:
            # Si es la cadena "user has no data", la dejamos tal cual (o podrías filtrarla)
            deduped.append(item)

    # 4) Devuelvo la lista final de "otros" usuarios
    return jsonify({"matches": deduped}), 200


@matches_bp.route('/matches/<int:user1_id>/<int:user2_id>', methods=['POST'])
@jwt_required()
@handle_errors
@require_user_exists('user1_id')
def post_match(user1_id: int, user2_id: int, _user1: User) -> Tuple[Response, int]:
    """Create a new match between two users"""
    current_user_id = get_jwt_identity()
    # Verify that the authenticated user is one of the users in the match
    if not verify_ownership(current_user_id, user1_id) and not verify_ownership(current_user_id, user2_id):
        return base.error_response('Unauthorized: You can only create matches involving yourself', 403)
    if user1_id == user2_id:
        return base.error_response('Cannot match yourself', 400)
    
    # Verify user2 exists
    user2, error_response = base.get_user_or_404(user2_id)
    if error_response:
        return error_response
    
    # prevent duplicates regardless of order
    existing = (db.session.query(Match)
                .filter(((Match.user1_id == user1_id) & (Match.user2_id == user2_id)) |
                ((Match.user1_id == user2_id) & (Match.user2_id == user1_id))).first())
    if existing:
        return base.error_response('Match already exists', 409)
    
    new_match = Match(user1_id=user1_id, user2_id=user2_id)
    db.session.add(new_match)
    db.session.commit()
    return base.serialize_response(new_match, 201)


@matches_bp.route('/matches/<int:match_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_match(match_id: int) -> Tuple[Response, int]:
    """Delete a match"""
    current_user_id = get_jwt_identity()
    match = db.session.get(Match, match_id)
    if not match:
        return base.error_response(f'Match with id {match_id} not found', 404)
    # Only users in the match can delete it
    if not verify_ownership(current_user_id, match.user1_id) and not verify_ownership(current_user_id, match.user2_id):
        return base.error_response('Unauthorized: You can only delete matches you are part of', 403)
    db.session.delete(match)
    db.session.commit()
    return base.success_response(f'Match {match_id} deleted', status_code=200)


# ========== LIKES ==========

@matches_bp.route('/likes', methods=['GET'])
def get_all_likes() -> Tuple[Response, int]:
    stmt = select(Like)
    likes = db.session.execute(stmt).scalars().all()
    return jsonify([like.serialize() for like in likes]), 200


@matches_bp.route('/likes/<int:like_id>', methods=['GET'])
@handle_errors
def get_single_like(like_id: int) -> Tuple[Response, int] | Response:
    """Get a single like by ID"""
    like = db.session.get(Like, like_id)
    if like is None:
        return base.error_response(f'like with id: {like_id} not found', 404)
    return base.serialize_response(like, 200)


@matches_bp.route('/likes_sent/<user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def get_likes_sent(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get all likes sent by a user"""
    likes = _user.likes_given
    serialized = [like.serialize() for like in likes]
    return jsonify({"likes_sent": serialized}), 200


@matches_bp.route('/likes_received/<user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def get_likes_received(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get all likes received by a user"""
    likes = _user.likes_received
    serialized = [like.serialize() for like in likes]
    return jsonify({"likes_received": serialized}), 200


@matches_bp.route('/likes/<int:like_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_like(like_id: int) -> Tuple[Response, int] | Response:
    """Delete a like"""
    current_user_id = get_jwt_identity()
    like = db.session.get(Like, like_id)
    if not like:
        return base.error_response(f'Like with id {like_id} not found', 404)
    # Only the liker can delete their like
    ownership_error = base.validate_ownership(current_user_id, like.liker_id)
    if ownership_error:
        return ownership_error

    # Comprobar si este like formó parte de un match
    match = (db.session.query(Match)
             .filter(
                 ((Match.user1_id == like.liker_id) & (Match.user2_id == like.liked_id)) |
                 ((Match.user1_id == like.liked_id) & (Match.user2_id == like.liker_id))
    )
        .first())

    # Si hay match, borrarlo
    if match:
        db.session.delete(match)

    # Borrar el like
    db.session.delete(like)
    db.session.commit()

    message = f'Like {like_id} deleted, match removed' if match else f'Like {like_id} deleted'
    return base.success_response(message, status_code=200)


@matches_bp.route('/likes/<int:liker_id>/<int:liked_id>', methods=['POST'])
@jwt_required()
@handle_errors
@require_user_exists('liker_id')
def post_like(liker_id: int, liked_id: int, _liker: User) -> Tuple[Response, int]:
    """Create a new like"""
    current_user_id = get_jwt_identity()
    # Verify that the authenticated user is the liker
    ownership_error = base.validate_ownership(current_user_id, liker_id)
    if ownership_error:
        return ownership_error
    
    if liker_id == liked_id:
        return base.error_response('Cannot like yourself', 400)

    # Verify liked user exists
    liked, error_response = base.get_user_or_404(liked_id)
    if error_response:
        return error_response

    # Check if like already exists
    existing = (db.session.query(Like).filter_by(
        liker_id=liker_id, liked_id=liked_id).first())
    if existing:
        return base.error_response('Like already exists', 409)

    # Create new like
    new_like = Like(liker_id=liker_id, liked_id=liked_id)
    db.session.add(new_like)
    db.session.commit()

    # Check if there's a mutual like (match)
    mutual_like = (db.session.query(Like).filter_by(
        liker_id=liked_id, liked_id=liker_id).first())
    if mutual_like:
        # Create match if it doesn't exist
        existing_match = (db.session.query(Match)
                         .filter(((Match.user1_id == liker_id) & (Match.user2_id == liked_id)) |
                                 ((Match.user1_id == liked_id) & (Match.user2_id == liker_id))).first())
        if not existing_match:
            new_match = Match(user1_id=liker_id, user2_id=liked_id)
            db.session.add(new_match)
            db.session.commit()
            return jsonify({'like': new_like.serialize(), 'match': new_match.serialize()}), 201

    return base.serialize_response(new_like, 201)


# ========== REJECTS ==========

@matches_bp.route('/rejects', methods=['GET'])
def get_all_rejects() -> Tuple[Response, int]:
    stmt = select(Reject)
    rejects = db.session.execute(stmt).scalars().all()
    return jsonify([reject.serialize() for reject in rejects]), 200


@matches_bp.route('/rejects/<reject_id>', methods=['GET'])
def get_single_reject(reject_id: int) -> Tuple[Response, int] | Response:
    stmt = select(Reject).where(Reject.id == reject_id)
    match = db.session.execute(stmt).scalar_one_or_none()
    if match is None:
        return jsonify({'error': f'match with id: {reject_id} not found'}), 400

    return jsonify(match.serialize())


@matches_bp.route('/rejects_sent/<user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def get_rejects_sent(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get all rejects sent by a user"""
    rejects = _user.rejects_given
    serialized = [reject.serialize() for reject in rejects]
    return jsonify({"rejects_authored": serialized}), 200


@matches_bp.route('/rejects_received/<user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def get_rejects_received(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get all rejects received by a user"""
    rejects = _user.rejects_received
    serialized = [reject.serialize() for reject in rejects]
    return jsonify({"rejects_received": serialized}), 200


@matches_bp.route('/rejects/<reject_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_reject(reject_id: int) -> Tuple[Response, int] | Response:
    """Delete a reject"""
    current_user_id = get_jwt_identity()
    reject = db.session.get(Reject, reject_id)
    if reject is None:
        return base.error_response(f'reject with id: {reject_id} not found', 404)
    # Only the user who sent the reject can delete it
    ownership_error = base.validate_ownership(current_user_id, reject.rejector_id)
    if ownership_error:
        return ownership_error

    db.session.delete(reject)
    db.session.commit()
    return base.success_response(f'reject with id: {reject_id} deleted', status_code=200)


@matches_bp.route('/rejects/<int:rejector_id>/<int:rejected_id>', methods=['POST'])
@jwt_required()
@handle_errors
@require_user_exists('rejector_id')
def post_reject(rejector_id: int, rejected_id: int, _rejector: User) -> Tuple[Response, int]:
    """Create a new reject"""
    current_user_id = get_jwt_identity()
    # Verify that the authenticated user is the rejector
    ownership_error = base.validate_ownership(current_user_id, rejector_id)
    if ownership_error:
        return ownership_error
    
    if rejector_id == rejected_id:
        return base.error_response('Cannot reject yourself', 400)

    # Verify rejected user exists
    rejected, error_response = base.get_user_or_404(rejected_id)
    if error_response:
        return error_response

    existing = (db.session.query(Reject).filter_by(
        rejector_id=rejector_id, rejected_id=rejected_id).first())
    if existing:
        return base.error_response('Reject already exists', 409)

    # Crear y persistir el nuevo reject
    new_reject = Reject(rejector_id=rejector_id, rejected_id=rejected_id)
    db.session.add(new_reject)
    db.session.commit()

    return base.serialize_response(new_reject, 201)


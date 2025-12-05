"""
Match, Like, and Reject management endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select, or_
from api.models import db, Match, Reject, Like, User
from api.validators import verify_ownership
from typing import Tuple

matches_bp = Blueprint('matches', __name__)


# ========== MATCHES ==========

@matches_bp.route('/matches', methods=['GET'])
def get_all_matches() -> Tuple[Response, int]:
    stmt = select(Match)
    matches = db.session.execute(stmt).scalars().all()
    return jsonify([match.serialize() for match in matches]), 200


@matches_bp.route('/matches/<int:match_id>', methods=['GET'])
def get_single_match(match_id: int) -> Tuple[Response, int]:
    stmt = select(Match).where(Match.id == match_id)
    match = db.session.execute(stmt).scalar_one_or_none()
    if not match:
        return jsonify({'error': f'Match with id {match_id} not found'}), 404
    return jsonify(match.serialize()), 200


@matches_bp.route('/matches/user/<int:user_id>', methods=['GET'])
def get_matches_for_user(user_id: int) -> Tuple[Response, int]:
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
def post_match(user1_id: int, user2_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    # Verify that the authenticated user is one of the users in the match
    if not verify_ownership(current_user_id, user1_id) and not verify_ownership(current_user_id, user2_id):
        return jsonify({'error': 'Unauthorized: You can only create matches involving yourself'}), 403
    if user1_id == user2_id:
        return jsonify({'error': 'Cannot match yourself'}), 400
    user1 = User.query.get(user1_id)
    user2 = User.query.get(user2_id)
    if not user1 or not user2:
        return jsonify({'error': 'User not found'}), 404
    # prevent duplicates regardless of order
    existing = (db.session.query(Match)
                .filter(((Match.user1_id == user1_id) & (Match.user2_id == user2_id)) |
                ((Match.user1_id == user2_id) & (Match.user2_id == user1_id))).first())
    if existing:
        return jsonify({'error': 'Match already exists'}), 409
    new_match = Match(user1_id=user1_id, user2_id=user2_id)
    db.session.add(new_match)
    db.session.commit()
    return jsonify(new_match.serialize()), 201


@matches_bp.route('/matches/<int:match_id>', methods=['DELETE'])
@jwt_required()
def delete_match(match_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    stmt = select(Match).where(Match.id == match_id)
    match = db.session.execute(stmt).scalar_one_or_none()
    if not match:
        return jsonify({'error': f'Match with id {match_id} not found'}), 404
    # Only users in the match can delete it
    if not verify_ownership(current_user_id, match.user1_id) and not verify_ownership(current_user_id, match.user2_id):
        return jsonify({'error': 'Unauthorized: You can only delete matches you are part of'}), 403
    db.session.delete(match)
    db.session.commit()
    return jsonify({'message': f'Match {match_id} deleted'}), 200


# ========== LIKES ==========

@matches_bp.route('/likes', methods=['GET'])
def get_all_likes() -> Tuple[Response, int]:
    stmt = select(Like)
    likes = db.session.execute(stmt).scalars().all()
    return jsonify([like.serialize() for like in likes]), 200


@matches_bp.route('/likes/<int:like_id>', methods=['GET'])
def get_single_like(like_id: int) -> Tuple[Response, int] | Response:
    stmt = select(Like).where(Like.id == like_id)
    like = db.session.execute(stmt).scalar_one_or_none()
    if like is None:
        return jsonify({'error': f'like with id: {like_id} not found'}), 400
    return jsonify(like.serialize())


@matches_bp.route('/likes_sent/<user_id>', methods=['GET'])
def get_likes_sent(user_id: int) -> Tuple[Response, int]:
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 400

    # 2. Sacamos los likes que ha enviado
    likes = user.likes_given

    # Serializamos cada like usando el método de instancia
    serialized = [like.serialize() for like in likes]

    return jsonify({"likes_sent": serialized}), 200


@matches_bp.route('/likes_received/<user_id>', methods=['GET'])
def get_likes_received(user_id: int) -> Tuple[Response, int]:
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 400

    # 2. Sacamos los likes que ha recibido
    likes = user.likes_received

    # Serializamos cada like usando el método de instancia
    serialized = [like.serialize() for like in likes]

    return jsonify({"likes_received": serialized}), 200


@matches_bp.route('/likes/<int:like_id>', methods=['DELETE'])
@jwt_required()
def delete_like(like_id: int) -> Tuple[Response, int] | Response:
    current_user_id = get_jwt_identity()
    # Buscar el like
    like = db.session.query(Like).get(like_id)
    if not like:
        return jsonify({'error': f'Like with id {like_id} not found'}), 404
    # Only the liker can delete their like
    if not verify_ownership(current_user_id, like.liker_id):
        return jsonify({'error': 'Unauthorized: You can only delete your own likes'}), 403

    # Comprobar si este like formó parte de un match
    match = (db.session.query(Match)
             .filter(
                 ((Match.user1_id == like.liker_id) & (Match.user2_id == like.liked_id)) |
                 ((Match.user1_id == like.liked_id) &
                  (Match.user2_id == like.liker_id))
    )
        .first())

    # Si hay match, borrarlo
    if match:
        db.session.delete(match)

    # Borrar el like
    db.session.delete(like)
    db.session.commit()

    return jsonify({'message': f'Like {like_id} deleted, match removed' if match else f'Like {like_id} deleted'}), 200


@matches_bp.route('/likes/<int:liker_id>/<int:liked_id>', methods=['POST'])
@jwt_required()
def post_like(liker_id: int, liked_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    # Verify that the authenticated user is the liker
    if not verify_ownership(current_user_id, liker_id):
        return jsonify({'error': 'Unauthorized: You can only like as yourself'}), 403
    if liker_id == liked_id:
        return jsonify({'error': 'Cannot like yourself'}), 400

    liker = db.session.get(User, liker_id)
    if liker is None:
        return jsonify({'error': f'User (liker) with id={liker_id} not found'}), 404

    liked = db.session.get(User, liked_id)
    if liked is None:
        return jsonify({'error': f'User (liked) with id={liked_id} not found'}), 404

    # Check if like already exists
    existing = (db.session.query(Like).filter_by(
        liker_id=liker_id, liked_id=liked_id).first())
    if existing:
        return jsonify({'error': 'Like already exists'}), 409

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

    return jsonify(new_like.serialize()), 201


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
def get_rejects_sent(user_id: int) -> Tuple[Response, int]:
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 400

    # 2. Sacamos los rejects que ha enviado
    rejects = user.rejects_given

    # Serializamos cada reject usando el método de instancia
    serialized = [reject.serialize() for reject in rejects]

    return jsonify({"rejects_authored": serialized}), 200


@matches_bp.route('/rejects_received/<user_id>', methods=['GET'])
def get_rejects_received(user_id: int) -> Tuple[Response, int]:
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 400

    # 2. Sacamos los rejects que ha recibido
    rejects = user.rejects_received

    # Serializamos cada reject usando el método de instancia
    serialized = [reject.serialize() for reject in rejects]

    return jsonify({"rejects_received": serialized}), 200


@matches_bp.route('/rejects/<reject_id>', methods=['DELETE'])
@jwt_required()
def delete_reject(reject_id: int) -> Tuple[Response, int] | Response:
    current_user_id = get_jwt_identity()
    stmt = select(Reject).where(Reject.id == reject_id)
    reject = db.session.execute(stmt).scalar_one_or_none()
    if reject is None:
        return jsonify({'error': f'reject with id: {reject_id} not found'}), 400
    # Only the user who sent the reject can delete it
    if not verify_ownership(current_user_id, reject.rejector_id):
        return jsonify({'error': 'Unauthorized: You can only delete your own rejects'}), 403

    db.session.delete(reject)
    db.session.commit()
    return jsonify({'message': f'reject with id: {reject_id} deleted'})


@matches_bp.route('/rejects/<int:rejector_id>/<int:rejected_id>', methods=['POST'])
@jwt_required()
def post_reject(rejector_id: int, rejected_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    # Verify that the authenticated user is the rejector
    if not verify_ownership(current_user_id, rejector_id):
        return jsonify({'error': 'Unauthorized: You can only reject as yourself'}), 403
    rejector = db.session.get(User, rejector_id)
    if rejector is None:
        return jsonify({'error': f'User (rejector) with id={rejector_id} not found'}), 404

    rejected = db.session.get(User, rejected_id)
    if rejected is None:
        return jsonify({'error': f'User (rejected) with id={rejected_id} not found'}), 404

    if rejector_id == rejected_id:
        return jsonify({'error': 'Cannot match with yourself'}), 400

    existing = (db.session.query(Reject).filter_by(
        rejector_id=rejector_id, rejected_id=rejected_id).first())
    if existing:
        return jsonify({'error': 'Reject already exists'}), 409

    # 4. Crear y persistir el nuevo reject
    new_reject = Reject(rejector_id=rejector_id, rejected_id=rejected_id)
    db.session.add(new_reject)
    db.session.commit()

    # 5. Responder con 201 Created y los datos del match
    return jsonify(new_reject.serialize()), 201


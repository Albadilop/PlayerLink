"""
Review management endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select
from api.models import db, Review, User
from api.validators import verify_ownership
from typing import Tuple

reviews_bp = Blueprint('reviews', __name__)


@reviews_bp.route('/reviews', methods=['GET'])
def get_All_Reviews() -> Tuple[Response, int]:
    stmt = select(Review)
    reviews = db.session.execute(stmt).scalars().all()
    return jsonify([review.serialize() for review in reviews]), 200


@reviews_bp.route('/reviews/<int:review_id>', methods=['GET'])
def get_reviews(review_id: int) -> Tuple[Response, int] | Response:
    stmt = select(Review).where(Review.id == review_id)
    review = db.session.execute(stmt).scalar_one_or_none()
    if review is None:
        return jsonify({'error': f'review with id: {review_id} does not exist'})
    return jsonify(review.serialize()), 200


@reviews_bp.route('/reviews_authored/<int:user_id>', methods=['GET'])
def get_reviews_authored(user_id: int) -> Tuple[Response, int]:
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 400

    # 2. Sacamos las reseñas que ha escrito
    reviews = user.reviews_authored

    # Serializamos cada review usando el método de instancia
    serialized = [rev.serialize() | {
        "stars": rev.stars,
        "comment": rev.comment
    } for rev in reviews]

    return jsonify({"reviews_authored": serialized}), 200


@reviews_bp.route('/reviews_received/<int:user_id>', methods=['GET'])
def get_user_reviews(user_id: int) -> Tuple[Response, int]:
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404

    # 2. Sacamos las reseñas que ha escrito
    reviews = user.reviews_received

    # Serializamos cada review usando el método de instancia
    serialized = [rev.serialize() | {
        "stars": rev.stars,
        "comment": rev.comment
    } for rev in reviews]

    return jsonify({"reviews_received": serialized}), 200


@reviews_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    review = Review.query.get(review_id)
    if review is None:
        return jsonify({'error': 'that review does not exist'}), 400
    # Only the author can delete their review
    if not verify_ownership(current_user_id, review.author_id):
        return jsonify({'error': 'Unauthorized: You can only delete your own reviews'}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'review deleted'}), 200


@reviews_bp.route('/reviews/<int:author_id>/<int:receiver_id>', methods=['POST'])
@jwt_required()
def post_review(author_id: int, receiver_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    # Verify that the authenticated user is the author
    if not verify_ownership(current_user_id, author_id):
        return jsonify({'error': 'Unauthorized: You can only create reviews as yourself'}), 403
    if author_id == receiver_id:
        return jsonify({'error': 'No puedes comentar sobre ti mismo'}), 400

    user_author = User.query.get(author_id)
    user_receiver = User.query.get(receiver_id)
    if user_author is None or user_receiver is None:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    data = request.get_json() or {}
    if 'stars' not in data or 'comment' not in data:
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    stars = int(data['stars'])
    if not 1 <= stars <= 5:
        return jsonify({'error': '"stars" debe estar entre 1 y 5'}), 400

    comment = data['comment'].strip()
    if not comment:
        return jsonify({'error': 'El comentario no puede estar vacío'}), 400

    # 5) Crear y persistir la reseña
    new_review = Review(
        user_id=receiver_id,
        author_id=author_id,
        stars=stars,
        comment=comment
    )

    db.session.add(new_review)
    db.session.commit()

    return jsonify(new_review.serialize()), 201


@reviews_bp.route('/reviews/<int:review_id>', methods=['PUT'])
@jwt_required()
def put_review(review_id: int) -> Tuple[Response, int]:
    current_user_id = get_jwt_identity()
    review = Review.query.get(review_id)
    if review is None:
        return jsonify({'error': 'that review does not exist'}), 400
    # Only the author can update their review
    if not verify_ownership(current_user_id, review.author_id):
        return jsonify({'error': 'Unauthorized: You can only update your own reviews'}), 403
    data = request.get_json()

    if 'stars' not in data or 'comment' not in data:
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    review.stars = data.get('stars', review.stars)
    review.comment = data.get('comment', review.comment)
    db.session.commit()
    return jsonify({'message': 'review updated'}), 200



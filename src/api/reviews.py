"""
Review management endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select
from api.models import db, Review, User
from api.validators import (
    verify_ownership,
    require_user_exists,
    validate_json,
    handle_errors,
)
from api.base import BaseEndpoint
from typing import Tuple

reviews_bp = Blueprint('reviews', __name__)
base = BaseEndpoint()


@reviews_bp.route('/reviews', methods=['GET'])
def get_All_Reviews() -> Tuple[Response, int]:
    stmt = select(Review)
    reviews = db.session.execute(stmt).scalars().all()
    return jsonify([review.serialize() for review in reviews]), 200


@reviews_bp.route('/reviews/<int:review_id>', methods=['GET'])
@handle_errors
def get_reviews(review_id: int) -> Tuple[Response, int] | Response:
    """Get a single review by ID"""
    review = db.session.get(Review, review_id)
    if review is None:
        return base.error_response(f'review with id: {review_id} does not exist', 404)
    return base.serialize_response(review, 200)


@reviews_bp.route('/reviews_authored/<int:user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def get_reviews_authored(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get all reviews authored by a user"""
    reviews = _user.reviews_authored
    serialized = [rev.serialize() | {
        "stars": rev.stars,
        "comment": rev.comment
    } for rev in reviews]
    return jsonify({"reviews_authored": serialized}), 200


@reviews_bp.route('/reviews_received/<int:user_id>', methods=['GET'])
@handle_errors
@require_user_exists('user_id')
def get_user_reviews(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get all reviews received by a user"""
    reviews = _user.reviews_received
    serialized = [rev.serialize() | {
        "stars": rev.stars,
        "comment": rev.comment
    } for rev in reviews]
    return jsonify({"reviews_received": serialized}), 200


@reviews_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def delete_review(review_id: int) -> Tuple[Response, int]:
    """Delete a review"""
    current_user_id = get_jwt_identity()
    review = db.session.get(Review, review_id)
    
    if review is None:
        return base.error_response('that review does not exist', 404)
    
    # Only the author can delete their review
    ownership_error = base.validate_ownership(current_user_id, review.author_id)
    if ownership_error:
        return ownership_error

    db.session.delete(review)
    db.session.commit()
    return base.success_response('review deleted', status_code=200)


@reviews_bp.route('/reviews/<int:author_id>/<int:receiver_id>', methods=['POST'])
@jwt_required()
@handle_errors
@require_user_exists('author_id')
@validate_json(['stars', 'comment'])
def post_review(
    author_id: int,
    receiver_id: int,
    _author: User,
    _data: dict
) -> Tuple[Response, int]:
    """Create a new review"""
    current_user_id = get_jwt_identity()
    
    # Verify that the authenticated user is the author
    ownership_error = base.validate_ownership(current_user_id, author_id)
    if ownership_error:
        return ownership_error
    
    if author_id == receiver_id:
        return base.error_response('No puedes comentar sobre ti mismo', 400)

    # Verify receiver exists
    user_receiver, error_response = base.get_user_or_404(receiver_id)
    if error_response:
        return error_response

    stars = int(_data['stars'])
    if not 1 <= stars <= 5:
        return base.error_response('"stars" debe estar entre 1 y 5', 400)

    comment = _data['comment'].strip()
    if not comment:
        return base.error_response('El comentario no puede estar vacío', 400)

    # Crear y persistir la reseña
    new_review = Review(
        user_id=receiver_id,
        author_id=author_id,
        stars=stars,
        comment=comment
    )

    db.session.add(new_review)
    db.session.commit()

    return base.serialize_response(new_review, 201)


@reviews_bp.route('/reviews/<int:review_id>', methods=['PUT'])
@jwt_required()
@handle_errors
@validate_json(['stars', 'comment'])
def put_review(review_id: int, _data: dict) -> Tuple[Response, int]:
    """Update a review"""
    current_user_id = get_jwt_identity()
    review = db.session.get(Review, review_id)
    
    if review is None:
        return base.error_response('that review does not exist', 404)
    
    # Only the author can update their review
    ownership_error = base.validate_ownership(current_user_id, review.author_id)
    if ownership_error:
        return ownership_error

    stars = int(_data.get('stars', review.stars))
    if not 1 <= stars <= 5:
        return base.error_response('"stars" debe estar entre 1 y 5', 400)

    comment = _data.get('comment', review.comment).strip()
    if not comment:
        return base.error_response('El comentario no puede estar vacío', 400)

    review.stars = stars
    review.comment = comment
    db.session.commit()
    return base.success_response('review updated', status_code=200)



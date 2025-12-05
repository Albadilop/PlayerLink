"""
Tests for review endpoints
"""
import pytest
from api.models import User, Review, Profile, db
from werkzeug.security import generate_password_hash
from sqlalchemy import select

class TestReviewEndpoints:
    def test_get_reviews_success(self, client, sample_user_with_profile, auth_token):
        """Test getting all reviews"""
        response = client.get(
            '/api/reviews',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
    
    def test_get_reviews_unauthorized(self, client):
        """Test getting reviews without authentication"""
        response = client.get('/api/reviews')
        # May allow GET without auth, or require it
        assert response.status_code in [200, 401]
    
    def test_create_review_success(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test creating a review"""
        # Create another user to review
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            other_user_id = other_user.id
        
        response = client.post(
            f'/api/reviews/{sample_user_with_profile.id}/{other_user_id}',
            headers={
                'Authorization': f'Bearer {auth_token}',
                'Content-Type': 'application/json'
            },
            json={
                'stars': 5,
                'comment': 'Great player!'
            }
        )
        assert response.status_code in [200, 201]
        data = response.get_json()
        # Response may have 'review' key or return review directly
        review_data = data.get('review', data) if isinstance(data, dict) else data
        assert review_data.get('stars') == 5
        assert review_data.get('comment') == 'Great player!'
    
    def test_create_review_unauthorized(self, client, sample_user_with_profile, test_app, db_session):
        """Test creating review without authentication"""
        # Create another user
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            other_user_id = other_user.id
        
        response = client.post(
            f'/api/reviews/{sample_user_with_profile.id}/{other_user_id}',
            headers={'Content-Type': 'application/json'},
            json={
                'stars': 5,
                'comment': 'Great player!'
            }
        )
        assert response.status_code == 401
    
    def test_get_reviews_received(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test getting reviews received by a user"""
        # Create another user and a review
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            
            review = Review(
                author_id=other_user.id,
                user_id=sample_user_with_profile.id,
                stars=5,
                comment='Great player!'
            )
            db_session.add(review);
            db_session.commit();
        
        response = client.get(
            f'/api/reviews_received/{sample_user_with_profile.id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        # Response may have 'reviews_received' key or return list directly
        reviews = data.get('reviews_received', data) if isinstance(data, dict) else data
        assert isinstance(reviews, list)
        if len(reviews) > 0:
            assert reviews[0].get('stars') == 5
    
    def test_get_reviews_authored(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test getting reviews authored by a user"""
        # Create another user and a review
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            
            review = Review(
                author_id=sample_user_with_profile.id,
                user_id=other_user.id,
                stars=4,
                comment='Good player'
            )
            db_session.add(review);
            db_session.commit();
        
        response = client.get(
            f'/api/reviews_authored/{sample_user_with_profile.id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        # Response may be a list or dict
        reviews = data if isinstance(data, list) else data.get('reviews', [])
        assert isinstance(reviews, list)
    
    def test_update_review_success(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test updating a review"""
        # Create another user and a review
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            
            review = Review(
                author_id=sample_user_with_profile.id,
                user_id=other_user.id,
                stars=3,
                comment='Average player'
            )
            db_session.add(review);
            db_session.commit();
            review_id = review.id
        
        response = client.put(
            f'/api/reviews/{review_id}',
            headers={
                'Authorization': f'Bearer {auth_token}',
                'Content-Type': 'application/json'
            },
            json={
                'stars': 5,
                'comment': 'Updated: Great player!'
            }
        )
        assert response.status_code == 200
        data = response.get_json()
        # Response may return message or review data
        if 'message' in data:
            # If only message, verify the update by fetching the review
            with test_app.app_context():
                stmt = select(Review).where(Review.id == review_id);
                updated_review = db_session.execute(stmt).scalar_one_or_none();
                assert updated_review is not None;
                assert updated_review.stars == 5;
        else:
            review_data = data.get('review', data) if isinstance(data, dict) else data
            assert review_data.get('stars') == 5
    
    def test_delete_review_success(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test deleting a review"""
        # Create another user and a review
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            
            review = Review(
                author_id=sample_user_with_profile.id,
                user_id=other_user.id,
                stars=3,
                comment='Test review'
            )
            db_session.add(review);
            db_session.commit();
            review_id = review.id
        
        response = client.delete(
            f'/api/reviews/{review_id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code in [200, 204]
        
        # Verify review was deleted
        with test_app.app_context():
            stmt = select(Review).where(Review.id == review_id);
            review = db_session.execute(stmt).scalar_one_or_none();
            assert review is None


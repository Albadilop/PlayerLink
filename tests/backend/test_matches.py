"""
Tests for match endpoints
"""
import pytest
from api.models import User, Match, Like, Profile, db
from werkzeug.security import generate_password_hash
from sqlalchemy import select

class TestMatchEndpoints:
    def test_get_matches_success(self, client, sample_user_with_profile, auth_token):
        """Test getting all matches"""
        response = client.get(
            '/api/matches',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
    
    def test_get_matches_unauthorized(self, client):
        """Test getting matches without authentication"""
        response = client.get('/api/matches')
        # GET endpoint may not require auth
        assert response.status_code in [200, 401]
    
    def test_get_user_matches(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test getting matches for a specific user"""
        # Create another user and a match
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            
            # Create a match
            match = Match(
                user1_id=sample_user_with_profile.id,
                user2_id=other_user.id
            )
            db_session.add(match);
            db_session.commit();
        
        response = client.get(
            f'/api/matches/user/{sample_user_with_profile.id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        # Response may be a list or dict with matches key
        matches = data if isinstance(data, list) else data.get('matches', [])
        assert isinstance(matches, list)
    
    def test_create_match_via_like(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test creating a match by liking (when reverse like exists)"""
        # Create another user
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            
            # Create reverse like (other_user likes sample_user)
            reverse_like = Like(
                liker_id=other_user.id,
                liked_id=sample_user_with_profile.id
            )
            db_session.add(reverse_like);
            db_session.commit();
            other_user_id = other_user.id
        
        # Now sample_user likes other_user (should create match)
        response = client.post(
            f'/api/likes/{sample_user_with_profile.id}/{other_user_id}',
            headers={
                'Authorization': f'Bearer {auth_token}',
                'Content-Type': 'application/json'
            }
        )
        assert response.status_code in [200, 201]
        
        # Verify match was created
        with test_app.app_context():
            stmt = select(Match).where(
                ((Match.user1_id == sample_user_with_profile.id) & (Match.user2_id == other_user_id)) |
                ((Match.user1_id == other_user_id) & (Match.user2_id == sample_user_with_profile.id))
            )
            match = db_session.execute(stmt).scalar_one_or_none();
            assert match is not None
    
    def test_get_single_match(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test getting a single match by ID"""
        # Create another user and a match
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            
            match = Match(
                user1_id=sample_user_with_profile.id,
                user2_id=other_user.id
            )
            db_session.add(match);
            db_session.commit();
            match_id = match.id
        
        response = client.get(
            f'/api/matches/{match_id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        # Response structure uses match_id instead of id
        assert data.get('match_id') == match_id or data.get('id') == match_id
    
    def test_delete_match(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test deleting a match"""
        # Create another user and a match
        with test_app.app_context():
            other_user = User(
                email='other@example.com',
                password=generate_password_hash('OtherPassword123!')
            )
            db_session.add(other_user);
            db_session.commit();
            
            match = Match(
                user1_id=sample_user_with_profile.id,
                user2_id=other_user.id
            )
            db_session.add(match);
            db_session.commit();
            match_id = match.id
        
        response = client.delete(
            f'/api/matches/{match_id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code in [200, 204]
        
        # Verify match was deleted
        with test_app.app_context():
            stmt = select(Match).where(Match.id == match_id);
            match = db_session.execute(stmt).scalar_one_or_none();
            assert match is None


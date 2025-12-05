"""
Tests for game endpoints
"""
import pytest
from api.models import User, Game, Profile, db
from werkzeug.security import generate_password_hash
from sqlalchemy import select

class TestGameEndpoints:
    def test_create_game_success(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test creating a new game"""
        # Get profile_id from user
        with test_app.app_context():
            stmt = select(Profile).where(Profile.user_id == sample_user_with_profile.id);
            profile = db_session.execute(stmt).scalar_one_or_none();
            profile_id = profile.id if profile else None;
        
        if not profile_id:
            pytest.skip("Profile not found");
        
        response = client.post(
            f'/api/games/{profile_id}',
            headers={
                'Authorization': f'Bearer {auth_token}',
                'Content-Type': 'application/json'
            },
            json={
                'title': 'Test Game',
                'hours_played': 100,
                'image': 'test-image.jpg'
            }
        )
        assert response.status_code in [200, 201]
        data = response.get_json()
        # Response uses gameTitle, gameImage, gameHoursPlayed
        assert data.get('gameTitle') == 'Test Game'
    
    def test_create_game_unauthorized(self, client, sample_user_with_profile, test_app, db_session):
        """Test creating game without authentication"""
        # Get profile_id from user
        with test_app.app_context():
            stmt = select(Profile).where(Profile.user_id == sample_user_with_profile.id);
            profile = db_session.execute(stmt).scalar_one_or_none();
            profile_id = profile.id if profile else None;
        
        if not profile_id:
            pytest.skip("Profile not found");
        
        response = client.post(
            f'/api/games/{profile_id}',
            headers={'Content-Type': 'application/json'},
            json={
                'title': 'Test Game',
                'hours_played': 100,
                'image': 'test-image.jpg'
            }
        )
        assert response.status_code == 401
    
    def test_get_user_games(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test getting user's games"""
        # Get profile_id from user
        with test_app.app_context():
            stmt = select(Profile).where(Profile.user_id == sample_user_with_profile.id);
            profile = db_session.execute(stmt).scalar_one_or_none();
            profile_id = profile.id if profile else None;
            
            if profile_id:
                # Create a game for the profile
                game = Game(
                    profile_id=profile_id,
                    game_title='Test Game',
                    game_hoursPlayed=100,
                    game_image='test-image.jpg'
                )
                db_session.add(game);
                db_session.commit();
        
        if not profile_id:
            pytest.skip("Profile not found");
        
        response = client.get(
            f'/api/games_by_profile/{profile_id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        # Response may have 'games' key or return array directly
        games = data.get('games', data) if isinstance(data, dict) else data
        assert isinstance(games, list)
    
    def test_update_game_success(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test updating a game"""
        # Get profile_id from user
        with test_app.app_context():
            stmt = select(Profile).where(Profile.user_id == sample_user_with_profile.id);
            profile = db_session.execute(stmt).scalar_one_or_none();
            profile_id = profile.id if profile else None;
            
            if profile_id:
                # Create a game for the profile
                game = Game(
                    profile_id=profile_id,
                    game_title='Test Game',
                    game_hoursPlayed=100,
                    game_image='test-image.jpg'
                )
                db_session.add(game);
                db_session.commit();
                game_id = game.id
            else:
                game_id = None
        
        if not game_id:
            pytest.skip("Game not created");
        
        response = client.put(
            f'/api/games/hours/{game_id}',
            headers={
                'Authorization': f'Bearer {auth_token}',
                'Content-Type': 'application/json'
            },
            json={
                'hours_played': 200
            }
        )
        assert response.status_code == 200
    
    def test_delete_game_success(self, client, sample_user_with_profile, auth_token, test_app, db_session):
        """Test deleting a game"""
        # Get profile_id from user
        with test_app.app_context():
            stmt = select(Profile).where(Profile.user_id == sample_user_with_profile.id);
            profile = db_session.execute(stmt).scalar_one_or_none();
            profile_id = profile.id if profile else None;
            
            if profile_id:
                # Create a game for the profile
                game = Game(
                    profile_id=profile_id,
                    game_title='Test Game',
                    game_hoursPlayed=100,
                    game_image='test-image.jpg'
                )
                db_session.add(game);
                db_session.commit();
                game_id = game.id
            else:
                game_id = None
        
        if not game_id:
            pytest.skip("Game not created");
        
        response = client.delete(
            f'/api/games/{game_id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code in [200, 204]


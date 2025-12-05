"""
Integration tests for complete user flows
"""
import pytest
from tests.backend.conftest import client, db_session
from api.models import User, Profile, Game, Review, Match, Like


class TestUserRegistrationFlow:
    """Test complete user registration and profile setup flow"""

    def test_complete_registration_flow(self, client):
        """Test: Register -> Login -> Create Profile -> Add Games"""
        # 1. Register
        register_response = client.post('/api/register', json={
            'email': 'newuser@example.com',
            'password': 'NewPassword123!'
        })
        assert register_response.status_code == 200
        token = register_response.get_json().get('token')
        assert token is not None
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # 2. Login
        login_response = client.post('/api/login', json={
            'email': 'newuser@example.com',
            'password': 'NewPassword123!'
        })
        assert login_response.status_code == 200
        
        # 3. Get user info (profile is created automatically on registration)
        user_response = client.get('/api/private', headers=headers)
        assert user_response.status_code == 200
        user_data = user_response.get_json()
        user_id = user_data['user']['id']
        profile_id = user_data['user']['profile']['id']
        
        # 4. Update profile (it already exists from registration)
        profile_response = client.put(f'/api/profiles/{user_id}',
            json={
                'name': 'New User',
                'nick_name': 'newuser',
                'age': 25,
                'gender': 'Male',
                'location': 'New City',
                'zodiac': 'Aries',
                'discord': 'newuser#1234',
                'steam_id': 'steam456',
                'languages': 'English',
                'preferences': 'Action, Adventure',
                'bio': 'New user bio',
                'photo': 'photo1'
            },
            headers=headers
        )
        assert profile_response.status_code == 200
        
        # 5. Add game
        game_response = client.post(f'/api/games/{profile_id}',
            json={
                'title': 'Test Game',
                'hours_played': 100,
                'image': 'game.jpg'
            },
            headers=headers
        )
        assert game_response.status_code == 201


class TestMatchFlow:
    """Test complete match creation flow"""

    def test_like_and_match_flow(self, client, db_session):
        """Test: User1 likes User2 -> User2 likes User1 -> Match created"""
        # Create two users
        user1 = User(
            email='user1@example.com',
            password='Password123!'
        )
        user2 = User(
            email='user2@example.com',
            password='Password123!'
        )
        db_session.add_all([user1, user2])
        db_session.commit()
        
        # Get tokens
        login1 = client.post('/api/login', json={
            'email': 'user1@example.com',
            'password': 'Password123!'
        })
        token1 = login1.get_json().get('token')
        
        login2 = client.post('/api/login', json={
            'email': 'user2@example.com',
            'password': 'Password123!'
        })
        token2 = login2.get_json().get('token')
        
        headers1 = {'Authorization': f'Bearer {token1}'}
        headers2 = {'Authorization': f'Bearer {token2}'}
        
        # User1 likes User2
        like_response = client.post(f'/api/likes/{user1.id}/{user2.id}',
            headers=headers1
        )
        assert like_response.status_code == 201
        
        # Check no match yet
        matches_response = client.get(f'/api/matches/user/{user1.id}', headers=headers1)
        assert matches_response.status_code == 200
        matches = matches_response.get_json().get('matches', [])
        assert len(matches) == 0
        
        # User2 likes User1 (creates match)
        like_response2 = client.post(f'/api/likes/{user2.id}/{user1.id}',
            headers=headers2
        )
        assert like_response2.status_code == 201
        
        # Check match was created
        matches_response2 = client.get(f'/api/matches/user/{user1.id}', headers=headers1)
        assert matches_response2.status_code == 200
        matches2 = matches_response2.get_json().get('matches', [])
        assert len(matches2) > 0


class TestReviewFlow:
    """Test complete review creation flow"""

    def test_review_creation_flow(self, client, db_session):
        """Test: User1 creates review for User2"""
        # Create two users with profiles
        user1 = User(email='reviewer@example.com', password='Password123!')
        user2 = User(email='reviewee@example.com', password='Password123!')
        db_session.add_all([user1, user2])
        db_session.commit()
        
        profile1 = Profile(user_id=user1.id, nick_name='reviewer', name='Reviewer')
        profile2 = Profile(user_id=user2.id, nick_name='reviewee', name='Reviewee')
        db_session.add_all([profile1, profile2])
        db_session.commit()
        
        # Login as user1
        login = client.post('/api/login', json={
            'email': 'reviewer@example.com',
            'password': 'Password123!'
        })
        token = login.get_json().get('token')
        headers = {'Authorization': f'Bearer {token}'}
        
        # Create review
        review_response = client.post(f'/api/reviews/{user1.id}/{user2.id}',
            json={
                'stars': 5,
                'comment': 'Great player!'
            },
            headers=headers
        )
        assert review_response.status_code == 201
        
        # Get reviews received by user2
        reviews_response = client.get(f'/api/reviews_received/{user2.id}')
        assert reviews_response.status_code == 200
        reviews = reviews_response.get_json().get('reviews_received', [])
        assert len(reviews) == 1
        assert reviews[0]['stars'] == 5


class TestProfileUpdateFlow:
    """Test complete profile update flow"""

    def test_profile_update_flow(self, client, sample_user_with_profile, auth_token):
        """Test: Update profile -> Verify changes -> Update again"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        user_id = sample_user_with_profile.id
        
        # Initial update
        update1 = client.put(f'/api/profiles/{user_id}',
            json={
                'name': 'Updated Name',
                'bio': 'Updated bio',
                'age': 30
            },
            headers=headers
        )
        assert update1.status_code == 200
        
        # Verify changes
        get_profile = client.get(f'/api/profiles/user/{user_id}', headers=headers)
        assert get_profile.status_code == 200
        profile_data = get_profile.get_json()
        assert profile_data['name'] == 'Updated Name'
        assert profile_data['bio'] == 'Updated bio'
        assert profile_data['age'] == 30
        
        # Update again
        update2 = client.put(f'/api/profiles/{user_id}',
            json={
                'name': 'Final Name',
                'location': 'Final City'
            },
            headers=headers
        )
        assert update2.status_code == 200
        
        # Verify final state
        get_profile2 = client.get(f'/api/profiles/user/{user_id}', headers=headers)
        profile_data2 = get_profile2.get_json()
        assert profile_data2['name'] == 'Final Name'
        assert profile_data2['location'] == 'Final City'
        # Previous values should be preserved
        assert profile_data2['bio'] == 'Updated bio'
        assert profile_data2['age'] == 30


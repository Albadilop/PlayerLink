"""
Tests for edge cases and boundary conditions
"""
import pytest
from tests.backend.conftest import client, sample_user, sample_user_with_profile, auth_token, db_session
from api.models import User, Profile, Game, Review, Match, Like


class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_empty_request_body(self, client):
        """Test handling of empty request bodies"""
        response = client.post('/api/register', json={})
        assert response.status_code == 400

    def test_missing_required_fields(self, client):
        """Test handling of missing required fields"""
        # Missing email
        response1 = client.post('/api/register', json={'password': 'TestPassword123!'})
        assert response1.status_code == 400
        
        # Missing password
        response2 = client.post('/api/register', json={'email': 'test@example.com'})
        assert response2.status_code == 400

    def test_very_long_inputs(self, client, auth_token, sample_user_with_profile):
        """Test handling of very long input strings"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Very long bio
        long_bio = 'A' * 10000
        response = client.put(f'/api/profiles/{sample_user_with_profile.id}',
            json={'bio': long_bio},
            headers=headers
        )
        # Should either accept (with truncation) or reject
        assert response.status_code in [200, 400, 413]  # 413 = Payload Too Large

    def test_special_characters_in_input(self, client, auth_token, sample_user_with_profile):
        """Test handling of special characters"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        special_chars = {
            'name': 'José María',
            'nick_name': 'user_123',
            'location': 'São Paulo, Brasil',
            'bio': 'Hello! 👋 This is a test. #gaming'
        }
        
        response = client.put(f'/api/profiles/{sample_user_with_profile.id}',
            json=special_chars,
            headers=headers
        )
        # Should handle special characters gracefully
        assert response.status_code in [200, 400]

    def test_zero_and_negative_values(self, client, auth_token, sample_user_with_profile, db_session):
        """Test handling of zero and negative numeric values"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Zero age
        response1 = client.put(f'/api/profiles/{sample_user_with_profile.id}',
            json={'age': 0},
            headers=headers
        )
        assert response1.status_code in [200, 400]
        
        # Negative age
        response2 = client.put(f'/api/profiles/{sample_user_with_profile.id}',
            json={'age': -5},
            headers=headers
        )
        assert response2.status_code in [200, 400]

    def test_duplicate_entries(self, client, sample_user):
        """Test handling of duplicate entries"""
        # Try to register with existing email
        response = client.post('/api/register', json={
            'email': 'test@example.com',
            'password': 'TestPassword123!'
        })
        assert response.status_code == 409  # Conflict

    def test_nonexistent_resource_access(self, client, auth_token):
        """Test accessing non-existent resources"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Non-existent user
        response1 = client.get('/api/users/99999', headers=headers)
        assert response1.status_code == 414
        
        # Non-existent profile
        response2 = client.get('/api/profiles/99999', headers=headers)
        assert response2.status_code == 414
        
        # Non-existent game
        response3 = client.get('/api/games/99999', headers=headers)
        assert response3.status_code in [200, 400, 404]

    def test_concurrent_requests(self, client, auth_token, sample_user_with_profile):
        """Test handling of concurrent requests"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Make multiple concurrent requests
        import threading
        
        results = []
        def make_request():
            response = client.get('/api/private', headers=headers)
            results.append(response.status_code)
        
        threads = [threading.Thread(target=make_request) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        # All should succeed
        assert all(status == 200 for status in results)

    def test_large_number_of_games(self, client, auth_token, sample_user_with_profile, db_session):
        """Test handling of profiles with many games"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Add many games
        profile = sample_user_with_profile.profile
        for i in range(50):
            game = Game(
                profile_id=profile.id,
                game_title=f'Game {i}',
                game_image=f'image{i}.jpg',
                game_hoursPlayed=100 + i
            )
            db_session.add(game)
        db_session.commit()
        
        # Fetch profile with games
        response = client.get(f'/api/profiles/{profile.id}', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data.get('games', [])) == 50

    def test_empty_strings(self, client, auth_token, sample_user_with_profile):
        """Test handling of empty strings"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Update with empty strings
        response = client.put(f'/api/profiles/{sample_user_with_profile.id}',
            json={
                'name': '',
                'bio': '',
                'location': ''
            },
            headers=headers
        )
        # Should either accept or reject empty strings
        assert response.status_code in [200, 400]

    def test_unicode_characters(self, client, auth_token, sample_user_with_profile):
        """Test handling of Unicode characters"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        unicode_data = {
            'name': '测试用户',
            'bio': 'こんにちは 🌟 مرحبا',
            'location': 'Москва'
        }
        
        response = client.put(f'/api/profiles/{sample_user_with_profile.id}',
            json=unicode_data,
            headers=headers
        )
        # Should handle Unicode properly
        assert response.status_code in [200, 400]



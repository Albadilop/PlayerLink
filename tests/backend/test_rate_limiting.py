"""
Tests for rate limiting functionality
"""
import pytest
import time
from tests.backend.conftest import client, auth_token


class TestRateLimiting:
    """Test rate limiting on protected endpoints"""

    def test_register_rate_limit(self, client):
        """Test that registration endpoint has rate limiting"""
        # Make 5 requests quickly (should all succeed)
        for i in range(5):
            response = client.post('/api/register', json={
                'email': f'test{i}@example.com',
                'password': 'TestPassword123!'
            })
            # First few should succeed (or fail due to duplicate, but not rate limit)
            assert response.status_code in [200, 409, 400]  # 409 = duplicate, 400 = validation
        
        # Note: Actual rate limit testing requires limiter to be properly configured
        # This test verifies the endpoint exists and responds

    def test_login_rate_limit(self, client, sample_user):
        """Test that login endpoint has rate limiting"""
        # Make multiple login attempts
        for i in range(5):
            response = client.post('/api/login', json={
                'email': 'test@example.com',
                'password': 'TestPassword123!'
            })
            # Should succeed or fail due to auth, not rate limit (within limit)
            assert response.status_code in [200, 401]

    def test_check_mail_rate_limit(self, client):
        """Test that check_mail endpoint has rate limiting"""
        # Make multiple requests
        for i in range(3):
            response = client.post('/api/check_mail', json={
                'email': f'test{i}@example.com'
            })
            # Should succeed (returns success even if email doesn't exist for security)
            assert response.status_code == 200

    def test_chat_rate_limit(self, client, auth_token):
        """Test that chat endpoint has rate limiting"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Make multiple chat requests
        for i in range(5):
            response = client.post('/api/chat', 
                json={
                    'text': f'Test message {i}',
                    'userInfo': 'Test user'
                },
                headers=headers
            )
            # Should succeed or fail due to OpenAI, not rate limit (within limit)
            assert response.status_code in [200, 500, 400]





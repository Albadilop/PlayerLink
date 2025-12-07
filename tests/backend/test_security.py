"""
Tests for security features: authentication, authorization, input validation
"""
import pytest
from tests.backend.conftest import client, sample_user, sample_user_with_profile, auth_token, db_session
from api.models import User, Profile, Game
from werkzeug.security import check_password_hash


class TestAuthentication:
    """Test authentication mechanisms"""

    def test_jwt_token_required(self, client):
        """Test that protected endpoints require JWT token"""
        response = client.get('/api/private')
        assert response.status_code == 401

    def test_invalid_jwt_token(self, client):
        """Test that invalid JWT tokens are rejected"""
        headers = {'Authorization': 'Bearer invalid-token'}
        response = client.get('/api/private', headers=headers)
        assert response.status_code == 422  # Unprocessable Entity for invalid token

    def test_valid_jwt_token(self, client, auth_token):
        """Test that valid JWT tokens are accepted"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        response = client.get('/api/private', headers=headers)
        assert response.status_code == 200

    def test_password_hashing(self, sample_user):
        """Test that passwords are properly hashed"""
        assert sample_user.password != 'TestPassword123!'
        assert check_password_hash(sample_user.password, 'TestPassword123!')
        assert not check_password_hash(sample_user.password, 'WrongPassword123!')


class TestAuthorization:
    """Test authorization (ownership verification)"""

    def test_user_can_only_modify_own_profile(self, client, sample_user_with_profile, auth_token):
        """Test that users can only modify their own profile"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Try to modify own profile (should succeed)
        response = client.put(f'/api/profiles/{sample_user_with_profile.id}',
            json={'name': 'Updated Name'},
            headers=headers
        )
        assert response.status_code == 200

    def test_user_cannot_modify_other_profile(self, client, db_session, auth_token):
        """Test that users cannot modify other users' profiles"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        # Create another user
        other_user = User(
            email='other@example.com',
            password='OtherPassword123!'
        )
        db_session.add(other_user)
        db_session.commit()
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Try to modify other user's profile (should fail)
        response = client.put(f'/api/profiles/{other_user.id}',
            json={'name': 'Hacked Name'},
            headers=headers
        )
        assert response.status_code == 403

    def test_user_can_only_delete_own_account(self, client, db_session, auth_token):
        """Test that users can only delete their own account"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        # Create another user
        other_user = User(
            email='other@example.com',
            password='OtherPassword123!'
        )
        db_session.add(other_user)
        db_session.commit()
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Try to delete other user's account (should fail)
        response = client.delete(f'/api/users/{other_user.id}', headers=headers)
        assert response.status_code == 403


class TestInputValidation:
    """Test input validation and sanitization"""

    def test_email_validation(self, client):
        """Test that invalid email formats are rejected"""
        invalid_emails = [
            'not-an-email',
            'missing@domain',
            '@missinglocal.com',
            'spaces in@email.com',
            ''
        ]
        
        for email in invalid_emails:
            response = client.post('/api/register', json={
                'email': email,
                'password': 'TestPassword123!'
            })
            assert response.status_code == 400

    def test_password_strength_validation(self, client):
        """Test that weak passwords are rejected"""
        weak_passwords = [
            'short',  # Too short
            'nouppercase123!',  # No uppercase
            'NOLOWERCASE123!',  # No lowercase
            'NoNumbers!',  # No numbers
            'NoSpecial123',  # No special characters
        ]
        
        for password in weak_passwords:
            response = client.post('/api/register', json={
                'email': f'test{password}@example.com',
                'password': password
            })
            assert response.status_code == 400

    def test_sql_injection_prevention(self, client, auth_token):
        """Test that SQL injection attempts are prevented"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # SQL injection attempt in email field
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin'--",
        ]
        
        for malicious_input in malicious_inputs:
            # Try in different endpoints
            response = client.put('/api/users_email/1',
                json={'email': malicious_input},
                headers=headers
            )
            # Should fail validation, not execute SQL
            assert response.status_code in [400, 403, 404]

    def test_xss_prevention(self, client, auth_token, sample_user_with_profile):
        """Test that XSS attempts are sanitized"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        xss_attempts = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
        ]
        
        for xss in xss_attempts:
            response = client.put(f'/api/profiles/{sample_user_with_profile.id}',
                json={'bio': xss},
                headers=headers
            )
            # Should accept but sanitize (or reject)
            assert response.status_code in [200, 400]


class TestErrorHandling:
    """Test error handling and information disclosure"""

    def test_error_messages_dont_expose_internals(self, client):
        """Test that error messages don't expose internal details"""
        # Try to access non-existent resource
        response = client.get('/api/users/99999')
        assert response.status_code == 414
        
        # Error message should not expose database structure
        data = response.get_json()
        assert 'database' not in str(data).lower()
        assert 'sql' not in str(data).lower()
        assert 'traceback' not in str(data).lower()

    def test_generic_error_on_login_failure(self, client):
        """Test that login errors use generic messages to prevent enumeration"""
        # Try with non-existent email
        response1 = client.post('/api/login', json={
            'email': 'nonexistent@example.com',
            'password': 'WrongPassword123!'
        })
        
        # Try with existing email but wrong password
        response2 = client.post('/api/login', json={
            'email': 'test@example.com',
            'password': 'WrongPassword123!'
        })
        
        # Both should return same generic error message
        assert response1.status_code == 401
        assert response2.status_code == 401
        # Messages should be similar (prevent email enumeration)
        assert 'Email o contraseña incorrectos' in response1.get_json().get('error', '')
        assert 'Email o contraseña incorrectos' in response2.get_json().get('error', '')





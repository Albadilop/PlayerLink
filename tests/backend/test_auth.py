"""
Tests for authentication endpoints
"""
import pytest
from api.models import User, db
from sqlalchemy import select
from werkzeug.security import generate_password_hash

class TestRegister:
    def test_register_success(self, client, db_session, test_app):
        """Test successful user registration"""
        response = client.post('/api/register', json={
            'email': 'newuser@example.com',
            'password': 'NewPassword123!'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert 'token' in data
        assert data.get('success') is True
        
        # Verify user was created
        with test_app.app_context():
            stmt = select(User).where(User.email == 'newuser@example.com')
            user = db.session.execute(stmt).scalar_one_or_none()
            assert user is not None
    
    def test_register_duplicate_email(self, client, sample_user):
        """Test registration with duplicate email"""
        response = client.post('/api/register', json={
            'email': 'test@example.com',
            'password': 'NewPassword123!'
        })
        assert response.status_code in [400, 409]  # Can be either conflict or bad request
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email"""
        response = client.post('/api/register', json={
            'email': 'invalid-email',
            'password': 'NewPassword123!'
        })
        assert response.status_code == 400
    
    def test_register_weak_password(self, client):
        """Test registration with weak password"""
        response = client.post('/api/register', json={
            'email': 'newuser@example.com',
            'password': 'weak'
        })
        assert response.status_code == 400

class TestLogin:
    def test_login_success(self, client, sample_user):
        """Test successful login"""
        response = client.post('/api/login', json={
            'email': 'test@example.com',
            'password': 'TestPassword123!'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert 'token' in data
        assert data['success'] == 'true'
    
    def test_login_invalid_credentials(self, client, sample_user):
        """Test login with invalid credentials"""
        response = client.post('/api/login', json={
            'email': 'test@example.com',
            'password': 'WrongPassword123!'
        })
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        response = client.post('/api/login', json={
            'email': 'nonexistent@example.com',
            'password': 'SomePassword123!'
        })
        assert response.status_code == 401


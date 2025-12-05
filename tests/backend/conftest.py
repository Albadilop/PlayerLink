"""
Pytest configuration and fixtures for backend tests
"""
import pytest
import os
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))

from dotenv import load_dotenv
load_dotenv()

# Set test environment variables before importing app
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-for-testing-only'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['FLASK_DEBUG'] = '0'
os.environ['OPENAI_API_KEY'] = 'test-key'

from app import app
from api.models import db, User, Profile
from werkzeug.security import generate_password_hash

@pytest.fixture(scope='function')
def test_app():
    """Create application for testing"""
    # Use in-memory SQLite database for tests
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key-for-testing-only'
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def client(test_app):
    """Create test client"""
    return test_app.test_client()

@pytest.fixture(scope='function')
def db_session(test_app):
    """Database session for tests"""
    with test_app.app_context():
        yield db.session

@pytest.fixture
def sample_user(db_session):
    """Create a sample user for testing"""
    user = User(
        email='test@example.com',
        password=generate_password_hash('TestPassword123!')
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def sample_user_with_profile(db_session, sample_user):
    """Create a user with a profile"""
    profile = Profile(
        user_id=sample_user.id,
        name='Test User',
        nick_name='testuser',
        age=25,
        gender='Male',
        location='Test City',
        zodiac='Aries',
        discord='test#1234',
        steam_id='steam123',
        language='English',
        preferences='Action, Adventure',
        bio='Test bio',
        photo='photo1'
    )
    db_session.add(profile)
    db_session.commit()
    return sample_user

@pytest.fixture
def auth_token(client, sample_user):
    """Get authentication token for a user"""
    response = client.post('/api/login', json={
        'email': 'test@example.com',
        'password': 'TestPassword123!'
    })
    if response.status_code == 200:
        data = response.get_json()
        return data.get('token')
    return None


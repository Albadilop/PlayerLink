"""
Tests for utility functions
"""
import pytest
from src.api.routes import validate_email, validate_password_strength, verify_ownership

class TestValidateEmail:
    def test_valid_email(self):
        assert validate_email("test@example.com") is True
        assert validate_email("user.name@domain.co.uk") is True
    
    def test_invalid_email(self):
        assert validate_email("invalid-email") is False
        assert validate_email("test@") is False
        assert validate_email("@example.com") is False
        assert validate_email("") is False
        assert validate_email(None) is False

class TestValidatePasswordStrength:
    def test_valid_password(self):
        valid, error = validate_password_strength("TestPass123!")
        assert valid is True
        assert error is None
    
    def test_short_password(self):
        valid, error = validate_password_strength("Test1!")
        assert valid is False
        assert "8 characters" in error
    
    def test_no_uppercase(self):
        valid, error = validate_password_strength("testpass123!")
        assert valid is False
        assert "uppercase" in error
    
    def test_no_number(self):
        valid, error = validate_password_strength("TestPassword!")
        assert valid is False
        assert "number" in error
    
    def test_no_special_char(self):
        valid, error = validate_password_strength("TestPassword123")
        assert valid is False
        assert "special character" in error
    
    def test_empty_password(self):
        valid, error = validate_password_strength("")
        assert valid is False
        assert error is not None

class TestVerifyOwnership:
    def test_same_user_id(self):
        assert verify_ownership("123", "123") is True
        assert verify_ownership(123, 123) is True
    
    def test_different_user_id(self):
        assert verify_ownership("123", "456") is False
        assert verify_ownership(123, 456) is False



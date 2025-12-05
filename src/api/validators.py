"""
Validation and authorization helper functions
"""
import re
from typing import Optional, Tuple
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required


def validate_email(email: str) -> bool:
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """Validate password strength"""
    if not password or not isinstance(password, str):
        return False, "Password is required"
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    if not re.search(r'[@$!%*?&.]', password):
        return False, "Password must contain at least one special character (@$!%*?&.)"
    return True, None


def verify_ownership(user_id_from_token: str, resource_user_id: str) -> bool:
    """Verify that the authenticated user owns the resource"""
    return str(user_id_from_token) == str(resource_user_id)


def require_ownership(f):
    """Decorator to verify user owns the resource they're trying to modify"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        # Extract user_id from kwargs or args
        user_id = kwargs.get('user_id') or (args[0] if args else None)
        if user_id and not verify_ownership(current_user_id, user_id):
            return jsonify({'error': 'Unauthorized: You can only modify your own data'}), 403
        return f(*args, **kwargs)
    return decorated_function



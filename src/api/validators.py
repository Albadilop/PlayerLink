"""
Validation and authorization helper functions
"""
import re
from typing import Optional, Tuple, Callable, Any
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from api.models import db, User, Profile


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


def require_user_exists(param_name: str = 'user_id'):
    """Decorator to verify that a user exists before executing the endpoint"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = kwargs.get(param_name) or (args[0] if args else None)
            if not user_id:
                return jsonify({'error': f'{param_name} is required'}), 400
            
            user = db.session.get(User, user_id)
            if not user:
                return jsonify({'error': f'User with id {user_id} not found'}), 404
            
            # Inject user into kwargs for use in the endpoint
            kwargs['_user'] = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_profile_exists(param_name: str = 'user_id'):
    """Decorator to verify that a profile exists before executing the endpoint"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = kwargs.get(param_name) or (args[0] if args else None)
            if not user_id:
                return jsonify({'error': f'{param_name} is required'}), 400
            
            user = db.session.get(User, user_id)
            if not user:
                return jsonify({'error': f'User with id {user_id} not found'}), 404
            
            if not user.profile:
                return jsonify({'error': f'Profile for user {user_id} does not exist'}), 404
            
            # Inject user and profile into kwargs
            kwargs['_user'] = user
            kwargs['_profile'] = user.profile
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_json(required_fields: Optional[list[str]] = None):
    """Decorator to validate that request has valid JSON and required fields"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Missing or invalid JSON data'}), 400
            
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        'error': f'Missing required fields: {", ".join(missing_fields)}'
                    }), 400
            
            # Inject data into kwargs
            kwargs['_data'] = data
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def handle_errors(f: Callable) -> Callable:
    """Decorator to handle errors consistently across endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except KeyError as e:
            return jsonify({'error': f'Missing required field: {str(e)}'}), 400
        except Exception as e:
            # Log the error in production
            import logging
            logging.error(f'Error in {f.__name__}: {str(e)}', exc_info=True)
            return jsonify({'error': 'An internal server error occurred'}), 500
    return decorated_function



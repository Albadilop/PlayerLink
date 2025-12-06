"""
Base class and helper functions for API endpoints
"""
from typing import Optional, Tuple
from flask import jsonify, Response
from sqlalchemy import select
from api.models import db, User, Profile
from api.validators import verify_ownership


class BaseEndpoint:
    """Base class with common methods for API endpoints"""
    
    @staticmethod
    def get_user_or_404(user_id: int) -> Tuple[Optional[User], Optional[Response]]:
        """
        Get a user by ID or return 404 response
        
        Returns:
            Tuple of (User, None) if found, or (None, 404 Response) if not found
        """
        user = db.session.get(User, user_id)
        if not user:
            return None, jsonify({'error': f'User with id {user_id} not found'}), 404
        return user, None
    
    @staticmethod
    def get_profile_or_404(user_id: int) -> Tuple[Optional[Profile], Optional[Response]]:
        """
        Get a profile by user ID or return 404 response
        
        Returns:
            Tuple of (Profile, None) if found, or (None, 404 Response) if not found
        """
        user = db.session.get(User, user_id)
        if not user:
            return None, jsonify({'error': f'User with id {user_id} not found'}), 404
        
        if not user.profile:
            return None, jsonify({'error': f'Profile for user {user_id} does not exist'}), 404
        
        return user.profile, None
    
    @staticmethod
    def validate_ownership(current_user_id: str, resource_user_id: int) -> Optional[Response]:
        """
        Validate that the current user owns the resource
        
        Returns:
            None if valid, 403 Response if not authorized
        """
        if not verify_ownership(current_user_id, str(resource_user_id)):
            return jsonify({'error': 'Unauthorized: You can only modify your own resources'}), 403
        return None
    
    @staticmethod
    def serialize_response(data: any, status_code: int = 200) -> Response:
        """
        Serialize response data consistently
        
        Args:
            data: Data to serialize (should have serialize() method or be dict/list)
            status_code: HTTP status code
        
        Returns:
            JSON response
        """
        if hasattr(data, 'serialize'):
            serialized = data.serialize()
        elif isinstance(data, (list, tuple)):
            serialized = [item.serialize() if hasattr(item, 'serialize') else item for item in data]
        else:
            serialized = data
        
        return jsonify(serialized), status_code
    
    @staticmethod
    def error_response(message: str, status_code: int = 400) -> Response:
        """
        Create a consistent error response
        
        Args:
            message: Error message
            status_code: HTTP status code
        
        Returns:
            JSON error response
        """
        return jsonify({'error': message}), status_code
    
    @staticmethod
    def success_response(message: str, data: Optional[any] = None, status_code: int = 200) -> Response:
        """
        Create a consistent success response
        
        Args:
            message: Success message
            data: Optional data to include
            status_code: HTTP status code
        
        Returns:
            JSON success response
        """
        response = {'message': message}
        if data is not None:
            if hasattr(data, 'serialize'):
                response['data'] = data.serialize()
            else:
                response['data'] = data
        return jsonify(response), status_code


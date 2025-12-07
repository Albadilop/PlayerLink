"""
User settings and preferences endpoints
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select
from api.models import db, User, UserSettings, BlockedUser, Profile
from api.validators import (
    require_user_exists,
    validate_json,
    handle_errors,
    require_ownership,
)
from api.base import BaseEndpoint
from typing import Tuple

settings_bp = Blueprint('settings', __name__)
base = BaseEndpoint()


@settings_bp.route('/settings/user/<int:user_id>', methods=['GET'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
def get_user_settings(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get user settings"""
    settings = db.session.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    ).scalar_one_or_none()
    
    if not settings:
        # Create default settings if they don't exist
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)
        db.session.commit()
    
    return base.serialize_response(settings, 200)


@settings_bp.route('/settings/user/<int:user_id>', methods=['PUT'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
@validate_json()
def update_user_settings(user_id: int, _user: User, _data: dict) -> Tuple[Response, int]:
    """Update user settings"""
    settings = db.session.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    ).scalar_one_or_none()
    
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)
    
    # Update matching preferences
    if 'matching' in _data:
        matching = _data['matching']
        if 'min_age_preference' in matching:
            settings.min_age_preference = matching['min_age_preference']
        if 'max_age_preference' in matching:
            settings.max_age_preference = matching['max_age_preference']
        if 'gender_preference' in matching:
            settings.gender_preference = matching['gender_preference']
        if 'language_preference' in matching:
            settings.language_preference = matching['language_preference']
        if 'gaming_preference' in matching:
            settings.gaming_preference = matching['gaming_preference']
        if 'min_hours_played' in matching:
            settings.min_hours_played = matching['min_hours_played']
        if 'only_common_games' in matching:
            settings.only_common_games = matching['only_common_games']
        if 'discovery_enabled' in matching:
            settings.discovery_enabled = matching['discovery_enabled']
    
    # Update privacy settings
    if 'privacy' in _data:
        privacy = _data['privacy']
        if 'profile_visible' in privacy:
            settings.profile_visible = privacy['profile_visible']
        if 'show_age' in privacy:
            settings.show_age = privacy['show_age']
        if 'show_location' in privacy:
            settings.show_location = privacy['show_location']
        if 'show_hours_played' in privacy:
            settings.show_hours_played = privacy['show_hours_played']
        if 'show_steam_id' in privacy:
            settings.show_steam_id = privacy['show_steam_id']
        if 'show_discord' in privacy:
            settings.show_discord = privacy['show_discord']
        if 'searchable' in privacy:
            settings.searchable = privacy['searchable']
    
    # Update notification preferences
    if 'notifications' in _data:
        notifications = _data['notifications']
        if 'email_match_notifications' in notifications:
            settings.email_match_notifications = notifications['email_match_notifications']
        if 'email_like_notifications' in notifications:
            settings.email_like_notifications = notifications['email_like_notifications']
        if 'email_review_notifications' in notifications:
            settings.email_review_notifications = notifications['email_review_notifications']
        if 'email_weekly_summary' in notifications:
            settings.email_weekly_summary = notifications['email_weekly_summary']
        if 'app_sound_notifications' in notifications:
            settings.app_sound_notifications = notifications['app_sound_notifications']
        if 'app_push_notifications' in notifications:
            settings.app_push_notifications = notifications['app_push_notifications']
    
    # Update gaming preferences
    if 'gaming' in _data:
        gaming = _data['gaming']
        if 'steam_sync_enabled' in gaming:
            settings.steam_sync_enabled = gaming['steam_sync_enabled']
        if 'steam_sync_frequency' in gaming:
            settings.steam_sync_frequency = gaming['steam_sync_frequency']
        if 'show_steam_library' in gaming:
            settings.show_steam_library = gaming['show_steam_library']
    
    # Update social preferences
    if 'social' in _data:
        social = _data['social']
        if 'chat_from_matches_only' in social:
            settings.chat_from_matches_only = social['chat_from_matches_only']
        if 'read_receipts_enabled' in social:
            settings.read_receipts_enabled = social['read_receipts_enabled']
    
    db.session.commit()
    return base.serialize_response(settings, 200)


@settings_bp.route('/settings/user/<int:user_id>/blocked', methods=['GET'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
def get_blocked_users(user_id: int, _user: User) -> Tuple[Response, int]:
    """Get list of blocked users"""
    blocked = db.session.execute(
        select(BlockedUser).where(BlockedUser.blocker_id == user_id)
    ).scalars().all()
    
    # Get profile info for blocked users
    result = []
    for block in blocked:
        blocked_user = db.session.execute(
            select(User).where(User.id == block.blocked_id)
        ).scalar_one_or_none()
        
        if blocked_user and blocked_user.profile:
            result.append({
                **block.serialize(),
                "blocked_user": {
                    "id": blocked_user.id,
                    "nick_name": blocked_user.profile.nick_name,
                    "photo": blocked_user.profile.photo,
                }
            })
        else:
            result.append(block.serialize())
    
    return jsonify({"blocked_users": result}), 200


@settings_bp.route('/settings/user/<int:user_id>/block', methods=['POST'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
@validate_json(['blocked_id'])
def block_user(user_id: int, _user: User, _data: dict) -> Tuple[Response, int]:
    """Block a user"""
    blocked_id = _data['blocked_id']
    reason = _data.get('reason', None)
    
    if blocked_id == user_id:
        return base.error_response('Cannot block yourself', 400)
    
    # Check if already blocked
    existing = db.session.execute(
        select(BlockedUser).where(
            BlockedUser.blocker_id == user_id,
            BlockedUser.blocked_id == blocked_id
        )
    ).scalar_one_or_none()
    
    if existing:
        return base.error_response('User already blocked', 400)
    
    blocked_user = BlockedUser(
        blocker_id=user_id,
        blocked_id=blocked_id,
        reason=reason
    )
    db.session.add(blocked_user)
    db.session.commit()
    
    return base.serialize_response(blocked_user, 200)


@settings_bp.route('/settings/user/<int:user_id>/block/<int:blocked_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
def unblock_user(user_id: int, blocked_id: int, _user: User) -> Tuple[Response, int]:
    """Unblock a user"""
    block = db.session.execute(
        select(BlockedUser).where(
            BlockedUser.blocker_id == user_id,
            BlockedUser.blocked_id == blocked_id
        )
    ).scalar_one_or_none()
    
    if not block:
        return base.error_response('User not blocked', 404)
    
    db.session.delete(block)
    db.session.commit()
    
    return base.success_response('User unblocked successfully', status_code=200)


@settings_bp.route('/settings/user/<int:user_id>/export', methods=['GET'])
@jwt_required()
@handle_errors
@require_user_exists('user_id')
@require_ownership
def export_user_data(user_id: int, _user: User) -> Tuple[Response, int]:
    """Export all user data (GDPR compliance)"""
    from api.models import Like, Match, Reject, Review, Game
    
    # Get all user data
    user_data = {
        "user": _user.serialize(),
        "profile": _user.profile.serialize() if _user.profile else None,
        "likes_given": [like.serialize() for like in _user.likes_given],
        "likes_received": [like.serialize() for like in _user.likes_received],
        "matches": [],
        "rejects_given": [reject.serialize() for reject in _user.rejects_given],
        "rejects_received": [reject.serialize() for reject in _user.rejects_received],
        "reviews_received": [review.serialize() for review in _user.reviews_received],
        "reviews_authored": [review.serialize() for review in _user.reviews_authored],
        "settings": None,
    }
    
    # Get matches
    matches_initiated = [match.serialize() for match in _user.matches_initiated]
    matches_received = [match.serialize() for match in _user.matches_received]
    user_data["matches"] = matches_initiated + matches_received
    
    # Get settings
    settings = db.session.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    ).scalar_one_or_none()
    if settings:
        user_data["settings"] = settings.serialize()
    
    # Get blocked users
    blocked = db.session.execute(
        select(BlockedUser).where(BlockedUser.blocker_id == user_id)
    ).scalars().all()
    user_data["blocked_users"] = [block.serialize() for block in blocked]
    
    return jsonify(user_data), 200




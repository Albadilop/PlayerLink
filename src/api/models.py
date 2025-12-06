from __future__ import annotations
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, ForeignKey, Integer, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(250), nullable=False)

    # Relaciones
    profile: Mapped[Optional[Profile]] = relationship(
        'Profile', back_populates='user', uselist=False,
        cascade='all, delete-orphan', single_parent=True
    )
    # Reseñas que le hacen a este usuario
    reviews_received: Mapped[List[Review]] = relationship(
        'Review', back_populates='user',
        foreign_keys='Review.user_id',
        cascade='all, delete-orphan'
    )
    # Reseñas que este usuario escribe
    reviews_authored: Mapped[List[Review]] = relationship(
        'Review', back_populates='author',
        foreign_keys='Review.author_id',
        cascade='all, delete-orphan'
    )
    # Likes que hace este usuario
    likes_given: Mapped[List[Like]] = relationship(
        'Like', foreign_keys='Like.liker_id', back_populates='liker',
        cascade='all, delete-orphan'
    )
    # Likes que este usuario recibe
    likes_received: Mapped[List[Like]] = relationship(
        'Like', foreign_keys='Like.liked_id', back_populates='liked',
        cascade='all, delete-orphan'
    )

    # Matches de este usuario
    matches_initiated: Mapped[List[Match]] = relationship(
        'Match', foreign_keys='Match.user1_id', back_populates='user1',
        cascade='all, delete-orphan'
    )
    matches_received: Mapped[List[Match]] = relationship(
        'Match', foreign_keys='Match.user2_id', back_populates='user2',
        cascade='all, delete-orphan'
    )

    rejects_given: Mapped[List[Reject]] = relationship(
        'Reject', foreign_keys='Reject.rejector_id',
        back_populates='rejector', cascade='all, delete-orphan'
    )
    rejects_received: Mapped[List[Reject]] = relationship(
        'Reject', foreign_keys='Reject.rejected_id',
        back_populates='rejected', cascade='all, delete-orphan'
    )

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            # No serializar password por seguridad
            "profile": self.profile.serialize() if self.profile else None
        }


class Profile(db.Model):
    __tablename__ = 'profiles'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), unique=True)
    gender: Mapped[str] = mapped_column(String(30), nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=True)
    name: Mapped[str] = mapped_column(String(40), nullable=True)
    discord: Mapped[str] = mapped_column(
        String(40), nullable=True)
    preferences: Mapped[str] = mapped_column(String(200), nullable=True)
    zodiac: Mapped[str] = mapped_column(String(20), nullable=True)
    location: Mapped[str] = mapped_column(String(50), nullable=True)
    nick_name: Mapped[str] = mapped_column(
        String(21), nullable=True)
    bio: Mapped[str] = mapped_column(String(500),nullable=True)
    photo: Mapped[str] = mapped_column(String(20), nullable=True)
    language: Mapped[str] = mapped_column(String(100), nullable=True)
    steam_id: Mapped[str] = mapped_column(
        String(200),nullable=True)

    # Relaciones
    user: Mapped[User] = relationship('User', back_populates='profile')
    games: Mapped[List[Game]] = relationship(
        'Game', back_populates='profile', cascade='all, delete-orphan')

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "gender": self.gender,
            'preferences': self.preferences,
            'zodiac': self.zodiac,
            'location': self.location,
            "nick_name": self.nick_name,
            "bio": self.bio,
            "language": self.language,
            "photo": self.photo,
            "name":self.name,
            "games": [g.serialize() for g in self.games] if self.games else [],
            "age": self.age,
            "discord": self.discord,
            "steam": self.steam_id
        }


class Review(db.Model):
    __tablename__ = 'reviews'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    stars: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(String(100), nullable=True)

    # Relaciones
    user: Mapped[User] = relationship(
        'User', back_populates='reviews_received', foreign_keys=[user_id])
    author: Mapped[User] = relationship(
        'User', back_populates='reviews_authored', foreign_keys=[author_id])

    def serialize(self):
        return {
            "id": self.id,
            'user_id': self.user_id,
            'user_nickname': self.user.profile.nick_name if self.user.profile and self.user.profile.nick_name else "undefinied",
            'author_id': self.author_id,
            'author_nickname': self.author.profile.nick_name if self.author.profile and self.author.profile.nick_name else "undefinied",
            "stars": self.stars,
            "comment": self.comment
        }


class Game(db.Model):
    __tablename__ = 'games'
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey(
        'profiles.id', ondelete='CASCADE'), nullable=False)
    game_title: Mapped[str] = mapped_column(nullable=True)
    game_image: Mapped[str] = mapped_column(nullable=True)
    game_hoursPlayed: Mapped[int]=mapped_column(nullable=True)

    # Relaciones
    profile: Mapped[Profile] = relationship('Profile', back_populates='games')

    def serialize(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "gameTitle": self.game_title,
            "gameImage": self.game_image,
            "gameHoursPlayed":self.game_hoursPlayed
        }


class Like(db.Model):
    __tablename__ = 'likes'
    id: Mapped[int] = mapped_column(primary_key=True)
    liker_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    liked_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relaciones
    liker: Mapped[User] = relationship(
        'User', foreign_keys=[liker_id], back_populates='likes_given')
    liked: Mapped[User] = relationship(
        'User', foreign_keys=[liked_id], back_populates='likes_received')

    def serialize(self):
        return {
            "id": self.id,
            "liker_id": self.liker_id,
            "liked_id": self.liked_id
        }


class Match(db.Model):
    __tablename__ = 'matches'
    id: Mapped[int] = mapped_column(primary_key=True)
    user1_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    user2_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relaciones
    user1: Mapped[User] = relationship(
        'User', foreign_keys=[user1_id], back_populates='matches_initiated')
    user2: Mapped[User] = relationship(
        'User', foreign_keys=[user2_id], back_populates='matches_received')

    def serialize(self):
        return {
            "match_id": self.id,
            "user1":{
                "user_id": self.user2_id,
                "user_data":{
                    "nickname": self.user1.profile.name if self.user1.profile.name else "undefined",
                "games": [g.serialize() for g in self.user1.profile.games] if self.user1.profile.games else [],
                "gender": self.user1.profile.gender if self.user1.profile.gender else "undefined",
                "age": self.user1.profile.age if self.user1.profile.age else "undefined",
                }if self.user1.profile
                else "user has no data"
            },
            "user2":{
                "user_id": self.user2_id,
                "user_data":{
                    "nickname": self.user2.profile.name if self.user2.profile.name else "undefined",
                "games": [g.serialize() for g in self.user2.profile.games] if self.user2.profile.games else [],
                "gender": self.user2.profile.gender if self.user2.profile.gender else "undefined"
                }if self.user2.profile
                else "user has no data"
            }
        }


class Reject(db.Model):
    __tablename__ = 'rejects'
    id: Mapped[int] = mapped_column(primary_key=True)
    rejector_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    rejected_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relaciones
    rejector: Mapped[User] = relationship(
        'User', foreign_keys=[rejector_id], back_populates='rejects_given')
    rejected: Mapped[User] = relationship(
        'User', foreign_keys=[rejected_id], back_populates='rejects_received')

    def serialize(self):
        return {
            "id": self.id,
            "rejector_id": self.rejector_id,
            "rejected_id": self.rejected_id
        }


class UserSettings(db.Model):
    """User settings and preferences"""
    __tablename__ = 'user_settings'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), unique=True, nullable=False)
    
    # Matching Preferences
    min_age_preference: Mapped[int] = mapped_column(Integer, nullable=True)
    max_age_preference: Mapped[int] = mapped_column(Integer, nullable=True)
    gender_preference: Mapped[str] = mapped_column(String(30), nullable=True)
    language_preference: Mapped[str] = mapped_column(String(200), nullable=True)
    gaming_preference: Mapped[str] = mapped_column(String(200), nullable=True)
    min_hours_played: Mapped[int] = mapped_column(Integer, nullable=True)
    only_common_games: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    discovery_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Privacy Settings
    profile_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_age: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_location: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_hours_played: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_steam_id: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_discord: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    searchable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Notification Preferences
    email_match_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_like_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_review_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_weekly_summary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    app_sound_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    app_push_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Gaming Preferences
    steam_sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    steam_sync_frequency: Mapped[str] = mapped_column(String(20), default='manual', nullable=True)  # manual, daily, weekly
    show_steam_library: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Social Preferences
    chat_from_matches_only: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    read_receipts_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationship
    user: Mapped[User] = relationship('User', backref='settings')
    
    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "matching": {
                "min_age_preference": self.min_age_preference,
                "max_age_preference": self.max_age_preference,
                "gender_preference": self.gender_preference,
                "language_preference": self.language_preference,
                "gaming_preference": self.gaming_preference,
                "min_hours_played": self.min_hours_played,
                "only_common_games": self.only_common_games,
                "discovery_enabled": self.discovery_enabled,
            },
            "privacy": {
                "profile_visible": self.profile_visible,
                "show_age": self.show_age,
                "show_location": self.show_location,
                "show_hours_played": self.show_hours_played,
                "show_steam_id": self.show_steam_id,
                "show_discord": self.show_discord,
                "searchable": self.searchable,
            },
            "notifications": {
                "email_match_notifications": self.email_match_notifications,
                "email_like_notifications": self.email_like_notifications,
                "email_review_notifications": self.email_review_notifications,
                "email_weekly_summary": self.email_weekly_summary,
                "app_sound_notifications": self.app_sound_notifications,
                "app_push_notifications": self.app_push_notifications,
            },
            "gaming": {
                "steam_sync_enabled": self.steam_sync_enabled,
                "steam_sync_frequency": self.steam_sync_frequency,
                "show_steam_library": self.show_steam_library,
            },
            "social": {
                "chat_from_matches_only": self.chat_from_matches_only,
                "read_receipts_enabled": self.read_receipts_enabled,
            }
        }


class BlockedUser(db.Model):
    """Blocked users"""
    __tablename__ = 'blocked_users'
    id: Mapped[int] = mapped_column(primary_key=True)
    blocker_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    blocked_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    reason: Mapped[str] = mapped_column(String(200), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    
    # Relationships
    blocker: Mapped[User] = relationship('User', foreign_keys=[blocker_id], backref='blocked_users')
    blocked: Mapped[User] = relationship('User', foreign_keys=[blocked_id], backref='blocked_by_users')
    
    def serialize(self):
        return {
            "id": self.id,
            "blocker_id": self.blocker_id,
            "blocked_id": self.blocked_id,
            "reason": self.reason,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
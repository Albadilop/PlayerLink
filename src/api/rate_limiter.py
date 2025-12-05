"""
Rate limiting configuration and helpers
"""
from typing import Callable
from flask import Blueprint

# Limiter will be set by app.py after blueprint registration
limiter = None


def apply_rate_limit_if_available(limit_str: str) -> Callable:
    """Helper to apply rate limit only if limiter is available"""
    def decorator(f: Callable) -> Callable:
        if limiter is not None:
            return limiter.limit(limit_str)(f)
        return f
    return decorator


def set_limiter(limiter_instance):
    """Set the limiter instance"""
    global limiter
    limiter = limiter_instance



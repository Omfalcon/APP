"""
JWT utilities for authentication and token management.

This module provides helper functions for JWT creation, validation,
and token extraction from requests.
"""

import logging
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import create_access_token as jwt_create_access_token
from flask_jwt_extended import get_jwt_identity
from jwt import ExpiredSignatureError, InvalidTokenError

logger = logging.getLogger(__name__)


def create_access_token(identity: str, expires_delta=None):
    """
    Create a JWT access token.

    Args:
        identity (str): User identifier (typically username or user_id).
        expires_delta (timedelta, optional): Custom expiration time.

    Returns:
        str: Encoded JWT token.
    """
    return jwt_create_access_token(identity=identity, expires_delta=expires_delta)


def get_jwt_from_request():
    """
    Extract JWT token from request headers.

    The token is expected in the Authorization header as: Bearer <token>

    Returns:
        str: JWT token or None if not found.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


def verify_token_from_request(token: str):
    """
    Verify JWT token validity (basic check).

    Args:
        token (str): JWT token to verify.

    Returns:
        dict: Decoded token data or None if invalid.
    """
    try:
        from flask_jwt_extended import decode_token

        return decode_token(token)
    except ExpiredSignatureError:
        logger.warning("JWT token expired")
        return None
    except InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {str(e)}")
        return None


def token_required(f):
    """
    Decorator to protect routes with JWT authentication.

    Usage:
        @app.route('/protected')
        @token_required
        def protected_route():
            current_user = get_jwt_identity()
            return {"message": f"Hello {current_user}"}

    Returns:
        function: Wrapped route handler.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_jwt_from_request()
        if not token:
            logger.warning("Missing authorization token")
            return jsonify({"error": "Missing authorization token"}), 401

        try:
            current_user = get_jwt_identity()
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            return jsonify({"error": "Invalid or expired token"}), 401

    return decorated

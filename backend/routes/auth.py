"""
Authentication routes for user signup and login.

This module provides REST endpoints for user registration and login,
returning JWT tokens for authenticated access.
"""

import logging
from flask import Blueprint, request, jsonify
from models import User
from utils.jwt_utils import create_access_token

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    User signup endpoint.

    Request JSON:
        {
            "username": "string",
            "password": "string"
        }

    Returns:
        JSON: {"message": "User created successfully", "token": "jwt_token"}
        or error response with 400/409 status.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        username = data.get("username", "").strip()
        password = data.get("password", "").strip()

        if not username or not password:
            return (
                jsonify({"error": "Username and password are required"}),
                400,
            )

        if len(username) < 3:
            return (
                jsonify({"error": "Username must be at least 3 characters"}),
                400,
            )

        if len(password) < 6:
            return (
                jsonify({"error": "Password must be at least 6 characters"}),
                400,
            )

        # Create user
        user = User.create_user(username, password)
        token = create_access_token(identity=username)

        logger.info(f"User '{username}' signed up successfully")
        return (
            jsonify(
                {
                    "message": "User created successfully",
                    "token": token,
                    "username": username,
                }
            ),
            201,
        )

    except ValueError as e:
        logger.warning(f"Signup validation error: {str(e)}")
        return jsonify({"error": str(e)}), 409
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    User login endpoint.

    Request JSON:
        {
            "username": "string",
            "password": "string"
        }

    Returns:
        JSON: {"message": "Login successful", "token": "jwt_token"}
        or error response with 400/401 status.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        username = data.get("username", "").strip()
        password = data.get("password", "").strip()

        if not username or not password:
            return (
                jsonify({"error": "Username and password are required"}),
                400,
            )

        # Verify credentials
        if not User.verify_password(username, password):
            logger.warning(f"Failed login attempt for username: {username}")
            return jsonify({"error": "Invalid username or password"}), 401

        # Create token
        token = create_access_token(identity=username)

        logger.info(f"User '{username}' logged in successfully")
        return (
            jsonify(
                {
                    "message": "Login successful",
                    "token": token,
                    "username": username,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/users", methods=["GET"])
def get_all_users():
    """
    Get list of all users (public endpoint for user discovery).

    Returns:
        JSON: List of users (without password hashes).
    """
    try:
        users = User.get_all_users()
        users_list = [
            {"username": user.get("username"), "id": str(user.get("_id"))}
            for user in users
        ]
        return jsonify({"users": users_list}), 200
    except Exception as e:
        logger.error(f"Error retrieving users: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

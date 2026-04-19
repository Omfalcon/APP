"""
Authentication routes for user signup and login.

This module provides REST endpoints for user registration and login,
returning JWT tokens for authenticated access.
"""

import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, GroupMessage, Message
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


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user info (protected endpoint).

    Returns:
        JSON: Current user information (username, id).
    """
    try:
        current_username = get_jwt_identity()
        user = User.get_user_by_username(current_username)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "username": user.get("username"),
            "id": str(user.get("_id"))
        }), 200
    except Exception as e:
        logger.error(f"Error retrieving current user: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/group-messages", methods=["GET"])
@jwt_required()
def get_group_messages():
    """
    Get global group chat message history (protected endpoint).

    Query Parameters:
        limit (int): Maximum number of messages to retrieve. Default 50, Max 100.
        skip (int): Number of messages to skip for pagination. Default 0.

    Returns:
        JSON: List of group messages with sender, content, and timestamp.
    """
    try:
        current_username = get_jwt_identity()
        
        # Get query parameters
        limit = request.args.get("limit", default=50, type=int)
        skip = request.args.get("skip", default=0, type=int)
        
        # Validate parameters
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 1
        if skip < 0:
            skip = 0
        
        # Fetch messages from database
        messages = GroupMessage.get_messages(limit=limit, skip=skip)
        
        logger.info(
            f"Retrieved group messages for user '{current_username}' "
            f"(limit={limit}, skip={skip})"
        )
        
        return jsonify({
            "messages": messages,
            "count": len(messages),
            "limit": limit,
            "skip": skip
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving group messages: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/messages/<username>", methods=["GET"])
@jwt_required()
def get_messages_with_user(username):
    """
    Get 1-on-1 message history with a specific user (protected endpoint).
    Implements sliding window pagination for performance.

    Path Parameters:
        username (str): Username of the other user in the conversation.

    Query Parameters:
        limit (int): Maximum number of messages to retrieve. Default 20, Max 50 (for performance).
        before_id (str): Optional - Get messages before this message ID (for pagination).

    Returns:
        JSON: List of recent messages between current user and specified user, sorted by timestamp.
    """
    try:
        current_username = get_jwt_identity()
        
        # Validate that the other user exists
        if not User.get_user_by_username(username):
            return jsonify({"error": "User not found"}), 404
        
        # Get query parameters
        limit = request.args.get("limit", default=20, type=int)
        before_id = request.args.get("before_id", default=None, type=str)
        
        # Validate parameters - STRICT LIMITS for performance
        if limit > 50:
            limit = 50
        if limit < 1:
            limit = 1
        
        # Fetch messages between the two users
        messages = Message.get_messages_between(current_username, username, limit=limit)
        
        # If before_id provided, filter to messages before that ID (for pagination)
        if before_id:
            try:
                from bson.objectid import ObjectId
                before_oid = ObjectId(before_id)
                messages = [m for m in messages if m.get("_id") < before_oid]
            except:
                pass  # Invalid ID, ignore filter
        
        # Convert MongoDB documents to JSON-serializable format
        serialized_messages = []
        for msg in messages:
            serialized_msg = {
                "_id": str(msg.get("_id", "")),
                "sender": msg.get("sender", ""),
                "receiver": msg.get("receiver", ""),
                "content": msg.get("content", ""),
                "timestamp": msg.get("timestamp", datetime.now(timezone.utc)).isoformat() if msg.get("timestamp") else datetime.now(timezone.utc).isoformat(),
                "is_read": msg.get("is_read", False)
            }
            serialized_messages.append(serialized_msg)
        
        logger.info(
            f"Retrieved {len(serialized_messages)} messages between '{current_username}' and '{username}' "
            f"(limit={limit})"
        )
        
        return jsonify({
            "messages": serialized_messages,
            "count": len(serialized_messages),
            "other_user": username,
            "has_more": len(serialized_messages) >= limit
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving messages with {username}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

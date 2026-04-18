"""
User model for authentication and user management.

This module defines the User model with methods for
creation, retrieval, and password management.
"""

import logging
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from utils.db import MongoDBConnection

logger = logging.getLogger(__name__)


class User:
    """
    User model for representing chat application users.

    Attributes:
        _id (ObjectId): Unique identifier.
        username (str): Unique username.
        password_hash (str): Hashed password (not stored in plain text).
        created_at (datetime): Account creation timestamp.
    """

    COLLECTION_NAME = "users"

    @staticmethod
    def create_user(username: str, password: str) -> dict:
        """
        Create a new user.

        Args:
            username (str): Unique username.
            password (str): Plain text password (will be hashed).

        Returns:
            dict: Created user document or None if failed.

        Raises:
            ValueError: If username already exists or inputs invalid.
        """
        if not username or not password:
            raise ValueError("Username and password are required")

        # Check if user exists
        if User.get_user_by_username(username):
            raise ValueError(f"Username '{username}' already exists")

        try:
            collection = MongoDBConnection.get_collection(User.COLLECTION_NAME)
            user_doc = {
                "username": username,
                "password_hash": generate_password_hash(password),
            }
            result = collection.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            logger.info(f"User '{username}' created successfully")
            return user_doc
        except Exception as e:
            logger.error(f"Error creating user '{username}': {str(e)}")
            raise

    @staticmethod
    def get_user_by_username(username: str) -> dict:
        """
        Retrieve user by username.

        Args:
            username (str): Username to search for.

        Returns:
            dict: User document if found, None otherwise.
        """
        try:
            collection = MongoDBConnection.get_collection(User.COLLECTION_NAME)
            return collection.find_one({"username": username})
        except Exception as e:
            logger.error(f"Error retrieving user '{username}': {str(e)}")
            return None

    @staticmethod
    def get_user_by_id(user_id) -> dict:
        """
        Retrieve user by ID.

        Args:
            user_id: User ObjectId or string representation.

        Returns:
            dict: User document if found, None otherwise.
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            collection = MongoDBConnection.get_collection(User.COLLECTION_NAME)
            return collection.find_one({"_id": user_id})
        except Exception as e:
            logger.error(f"Error retrieving user by ID: {str(e)}")
            return None

    @staticmethod
    def verify_password(username: str, password: str) -> bool:
        """
        Verify user password.

        Args:
            username (str): Username.
            password (str): Plain text password to verify.

        Returns:
            bool: True if password is correct, False otherwise.
        """
        try:
            user = User.get_user_by_username(username)
            if not user:
                return False
            return check_password_hash(user.get("password_hash", ""), password)
        except Exception as e:
            logger.error(f"Error verifying password for '{username}': {str(e)}")
            return False

    @staticmethod
    def get_all_users(exclude_current: str = None) -> list:
        """
        Get all users (useful for user discovery).

        Args:
            exclude_current (str, optional): Username to exclude from results.

        Returns:
            list: List of user documents.
        """
        try:
            collection = MongoDBConnection.get_collection(User.COLLECTION_NAME)
            query = {}
            if exclude_current:
                query = {"username": {"$ne": exclude_current}}
            users = list(collection.find(query, {"password_hash": 0}))
            return users
        except Exception as e:
            logger.error(f"Error retrieving all users: {str(e)}")
            return []

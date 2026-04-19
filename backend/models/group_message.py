"""
GroupMessage model for global group chat message storage and retrieval.

This module defines the GroupMessage model with methods for
saving, retrieving, and managing group chat messages.
"""

import logging
from datetime import datetime, timezone
from bson.objectid import ObjectId
from utils.db import MongoDBConnection

logger = logging.getLogger(__name__)


class GroupMessage:
    """
    GroupMessage model for representing group chat messages.

    Attributes:
        _id (ObjectId): Unique identifier.
        sender_username (str): Username of sender.
        content (str): Message content.
        timestamp (datetime): When message was sent.
    """

    COLLECTION_NAME = "group_messages"

    @staticmethod
    def save_message(sender_username: str, content: str) -> dict:
        """
        Save a new group message to the database.

        Args:
            sender_username (str): Username of sender.
            content (str): Message content.

        Returns:
            dict: Saved message document with _id and timestamp.

        Raises:
            Exception: If database operation fails.
        """
        try:
            db = MongoDBConnection.get_db()
            collection = db[GroupMessage.COLLECTION_NAME]

            message_doc = {
                "sender_username": sender_username,
                "content": content,
                "timestamp": datetime.now(timezone.utc),
            }

            result = collection.insert_one(message_doc)
            message_doc["_id"] = result.inserted_id
            message_doc["timestamp"] = message_doc["timestamp"].isoformat()

            logger.info(
                f"Group message saved from {sender_username}: {result.inserted_id}"
            )
            return message_doc

        except Exception as e:
            logger.error(f"Error saving group message: {str(e)}")
            raise

    @staticmethod
    def get_messages(limit: int = 50, skip: int = 0) -> list:
        """
        Retrieve group messages from database.

        Args:
            limit (int): Maximum number of messages to retrieve. Default 50.
            skip (int): Number of messages to skip. Default 0.

        Returns:
            list: List of group message documents, sorted by timestamp (ascending).

        Raises:
            Exception: If database operation fails.
        """
        try:
            db = MongoDBConnection.get_db()
            collection = db[GroupMessage.COLLECTION_NAME]

            messages = list(
                collection.find()
                .sort("timestamp", 1)
                .skip(skip)
                .limit(limit)
            )

            # Convert ObjectId and datetime to strings for JSON serialization
            for msg in messages:
                msg["_id"] = str(msg["_id"])
                if isinstance(msg["timestamp"], datetime):
                    msg["timestamp"] = msg["timestamp"].isoformat()

            logger.info(
                f"Retrieved {len(messages)} group messages (skip={skip}, limit={limit})"
            )
            return messages

        except Exception as e:
            logger.error(f"Error retrieving group messages: {str(e)}")
            raise

    @staticmethod
    def get_recent_messages(count: int = 50) -> list:
        """
        Retrieve the most recent group messages.

        Args:
            count (int): Number of recent messages to retrieve. Default 50.

        Returns:
            list: List of most recent group message documents.

        Raises:
            Exception: If database operation fails.
        """
        try:
            db = MongoDBConnection.get_db()
            collection = db[GroupMessage.COLLECTION_NAME]

            messages = list(
                collection.find()
                .sort("timestamp", -1)
                .limit(count)
            )

            # Reverse to get chronological order
            messages.reverse()

            # Convert ObjectId and datetime to strings for JSON serialization
            for msg in messages:
                msg["_id"] = str(msg["_id"])
                if isinstance(msg["timestamp"], datetime):
                    msg["timestamp"] = msg["timestamp"].isoformat()

            return messages

        except Exception as e:
            logger.error(f"Error retrieving recent group messages: {str(e)}")
            raise

    @staticmethod
    def clear_all_messages() -> dict:
        """
        Delete all group messages from database (debug/testing only).

        Returns:
            dict: Deletion result with number of messages deleted.
        """
        try:
            db = MongoDBConnection.get_db()
            collection = db[GroupMessage.COLLECTION_NAME]
            result = collection.delete_many({})
            logger.warning(f"Cleared {result.deleted_count} group messages")
            return {"deleted_count": result.deleted_count}
        except Exception as e:
            logger.error(f"Error clearing group messages: {str(e)}")
            raise

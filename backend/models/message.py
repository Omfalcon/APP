"""
Message model for chat message storage and retrieval.

This module defines the Message model with methods for
saving, retrieving, and managing chat messages.
"""

import logging
from datetime import datetime, timezone
from bson.objectid import ObjectId
from utils.db import MongoDBConnection

logger = logging.getLogger(__name__)


class Message:
    """
    Message model for representing chat messages.

    Attributes:
        _id (ObjectId): Unique identifier.
        sender (str): Username of sender.
        receiver (str): Username of receiver.
        content (str): Message content.
        timestamp (datetime): When message was sent.
        is_read (bool): Whether message has been read.
    """

    COLLECTION_NAME = "messages"

    @staticmethod
    def save_message(sender: str, receiver: str, content: str) -> dict:
        """
        Save a new message to the database.

        Args:
            sender (str): Username of sender.
            receiver (str): Username of receiver.
            content (str): Message content.

        Returns:
            dict: Saved message document.

        Raises:
            ValueError: If inputs are invalid.
        """
        if not sender or not receiver or not content:
            raise ValueError("Sender, receiver, and content are required")

        try:
            collection = MongoDBConnection.get_collection(Message.COLLECTION_NAME)
            message_doc = {
                "sender": sender,
                "receiver": receiver,
                "content": content,
                "timestamp": datetime.now(timezone.utc),
                "is_read": False,
            }
            result = collection.insert_one(message_doc)
            message_doc["_id"] = result.inserted_id
            logger.info(f"Message saved from {sender} to {receiver}")
            return message_doc
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            raise

    @staticmethod
    def get_messages_between(user1: str, user2: str, limit: int = 100) -> list:
        """
        Retrieve messages between two users (conversation history).

        Args:
            user1 (str): First username.
            user2 (str): Second username.
            limit (int): Maximum number of messages to return.

        Returns:
            list: List of message documents sorted by timestamp.
        """
        try:
            collection = MongoDBConnection.get_collection(Message.COLLECTION_NAME)
            query = {
                "$or": [
                    {"sender": user1, "receiver": user2},
                    {"sender": user2, "receiver": user1},
                ]
            }
            messages = (
                collection.find(query)
                .sort("timestamp", 1)
                .limit(limit)
            )
            return list(messages)
        except Exception as e:
            logger.error(f"Error retrieving messages between {user1} and {user2}: {str(e)}")
            return []

    @staticmethod
    def get_unread_messages(receiver: str) -> list:
        """
        Get all unread messages for a user.

        Args:
            receiver (str): Username of message receiver.

        Returns:
            list: List of unread message documents.
        """
        try:
            collection = MongoDBConnection.get_collection(Message.COLLECTION_NAME)
            messages = list(
                collection.find(
                    {"receiver": receiver, "is_read": False}
                ).sort("timestamp", -1)
            )
            return messages
        except Exception as e:
            logger.error(f"Error retrieving unread messages for {receiver}: {str(e)}")
            return []

    @staticmethod
    def mark_as_read(message_id) -> bool:
        """
        Mark a message as read.

        Args:
            message_id: ObjectId of the message.

        Returns:
            bool: True if update was successful.
        """
        try:
            if isinstance(message_id, str):
                message_id = ObjectId(message_id)
            collection = MongoDBConnection.get_collection(Message.COLLECTION_NAME)
            result = collection.update_one(
                {"_id": message_id}, {"$set": {"is_read": True}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking message as read: {str(e)}")
            return False

    @staticmethod
    def delete_message(message_id) -> bool:
        """
        Delete a message.

        Args:
            message_id: ObjectId of the message to delete.

        Returns:
            bool: True if deletion was successful.
        """
        try:
            if isinstance(message_id, str):
                message_id = ObjectId(message_id)
            collection = MongoDBConnection.get_collection(Message.COLLECTION_NAME)
            result = collection.delete_one({"_id": message_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting message: {str(e)}")
            return False

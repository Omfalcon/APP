"""
Database connection and utilities for MongoDB.

This module handles MongoDB connection, initialization,
and provides helper functions for database operations.
"""

import logging
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure

logger = logging.getLogger(__name__)


class MongoDBConnection:
    """
    MongoDB connection manager.

    Handles connection lifecycle, health checks, and collection access.
    """

    _client = None
    _db = None

    @staticmethod
    def connect(mongo_uri: str, database_name: str):
        """
        Establish MongoDB connection.

        Args:
            mongo_uri (str): MongoDB connection string.
            database_name (str): Database name.

        Raises:
            ConnectionFailure: If connection fails.
        """
        try:
            MongoDBConnection._client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=5000,
                retryWrites=True,
                w="majority",
            )
            # Verify connection
            MongoDBConnection._client.admin.command("ping")
            MongoDBConnection._db = MongoDBConnection._client[database_name]
            logger.info("Successfully connected to MongoDB")
            return MongoDBConnection._db
        except ServerSelectionTimeoutError as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection error: {str(e)}")
            raise

    @staticmethod
    def get_db():
        """
        Get the MongoDB database instance.

        Returns:
            Database: MongoDB database instance.
        """
        if MongoDBConnection._db is None:
            raise RuntimeError("MongoDB not connected. Call connect() first.")
        return MongoDBConnection._db

    @staticmethod
    def close():
        """Close MongoDB connection."""
        if MongoDBConnection._client:
            MongoDBConnection._client.close()
            MongoDBConnection._db = None
            MongoDBConnection._client = None
            logger.info("MongoDB connection closed")

    @staticmethod
    def get_collection(collection_name: str):
        """
        Get a collection from the database.

        Args:
            collection_name (str): Name of the collection.

        Returns:
            Collection: MongoDB collection.
        """
        db = MongoDBConnection.get_db()
        return db[collection_name]

    @staticmethod
    def initialize_indexes():
        """Create necessary indexes for collections."""
        try:
            db = MongoDBConnection.get_db()

            # Users collection indexes
            users = db["users"]
            users.create_index("username", unique=True)
            logger.info("Created indexes for 'users' collection")

            # Messages collection indexes
            messages = db["messages"]
            
            # CLEANUP: Drop legacy unique index if it exists (from previous conversation-model experiments)
            try:
                messages.drop_index("participants_1")
                logger.info("Dropped legacy 'participants_1' index")
            except Exception:
                pass # Index doesn't exist, which is fine
                
            messages.create_index("sender")
            messages.create_index("receiver")
            messages.create_index("timestamp")
            messages.create_index([("sender", 1), ("receiver", 1)])
            logger.info("Created indexes for 'messages' collection")
        except Exception as e:
            logger.error(f"Error creating indexes: {str(e)}")
            raise

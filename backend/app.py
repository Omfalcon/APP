"""
Application factory for the Chat Application.

This module creates and configures the Flask application instance,
sets up all extensions, and initializes the application for both
development and production use.
"""
#checking

import logging
import logging.config
from flask import Flask, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
import os

from config import get_config
from utils.db import MongoDBConnection
from routes import register_blueprints
from sockets import register_socketio_events

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def create_app(config_class=None):
    """
    Create and configure the Flask application.

    Args:
        config_class (Config, optional): Configuration class to use.
            If None, uses get_config() to determine environment.

    Returns:
        Flask: Configured Flask application instance.
    """
    app = Flask(__name__)

    # Load configuration
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)

    # Initialize Flask extensions
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    logger.info(
        f"CORS configured for origins: {app.config['CORS_ORIGINS']}"
    )

    JWTManager(app)
    logger.info("JWT Manager initialized")

    socketio = SocketIO(
        app,
        cors_allowed_origins=app.config["SOCKETIO_CORS_ALLOWED_ORIGINS"],
        async_mode=app.config["SOCKETIO_ASYNC_MODE"],
        message_queue=app.config["SOCKETIO_MESSAGE_QUEUE"],
    )
    logger.info(
        f"Socket.IO initialized with async_mode: {app.config['SOCKETIO_ASYNC_MODE']}"
    )

    # Initialize Database
    try:
        MongoDBConnection.connect(
            app.config["MONGO_URI"],
            app.config["DATABASE_NAME"],
        )
        MongoDBConnection.initialize_indexes()
        logger.info("MongoDB connected and indexes initialized")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise

    # Register blueprints (REST routes)
    register_blueprints(app)
    logger.info("REST API routes registered")

    # Register Socket.IO events
    register_socketio_events(socketio)
    logger.info("Socket.IO event handlers registered")

    # Application status route
    @app.route("/health", methods=["GET"])
    def health_check():
        """Health check endpoint."""
        return {"status": "ok", "message": "Chat API is running"}, 200

    # Debug: Clear all messages (for testing only)
    @app.route("/api/debug/clear-messages", methods=["DELETE"])
    def clear_messages():
        """Clear all messages from database (debug only)."""
        try:
            from utils.db import MongoDBConnection
            collection = MongoDBConnection.get_collection("messages")
            result = collection.delete_many({})
            return {"status": "ok", "deleted": result.deleted_count}, 200
        except Exception as e:
            return {"error": str(e)}, 500

    # Debug: Get message timestamps
    @app.route("/api/debug/message-timestamps", methods=["GET"])
    def get_message_timestamps():
        """Get sample message timestamps (debug only)."""
        try:
            from utils.db import MongoDBConnection
            collection = MongoDBConnection.get_collection("messages")
            messages = list(collection.find().limit(5))
            return {
                "messages": [
                    {
                        "sender": m.get("sender"),
                        "timestamp": str(m.get("timestamp")),
                        "iso": m.get("timestamp").isoformat() if m.get("timestamp") else None
                    }
                    for m in messages
                ]
            }, 200
        except Exception as e:
            return {"error": str(e)}, 500

    # Serve frontend
    @app.route("/", methods=["GET"])
    def serve_frontend():
        """Serve the frontend index.html file."""
        frontend_path = os.path.join(os.path.dirname(__file__), "index.html")
        if os.path.exists(frontend_path):
            return send_file(frontend_path)
        return {"error": "Frontend not found"}, 404

    @app.route("/index.html", methods=["GET"])
    def serve_frontend_direct():
        """Serve the frontend index.html file directly."""
        frontend_path = os.path.join(os.path.dirname(__file__), "index.html")
        if os.path.exists(frontend_path):
            return send_file(frontend_path)
        return {"error": "Frontend not found"}, 404

    # Cleanup on shutdown
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        """Clean up database connections on app shutdown."""
        pass  # MongoDB client will auto-reconnect

    logger.info("Application factory setup complete")

    return app, socketio

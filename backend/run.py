"""
Application entry point.

This is the main executable that starts the Flask-SocketIO server
using Eventlet as the production-ready WSGI server.

Usage:
    python run.py
"""

import os
import sys
import logging
from app import create_app

# Ensure the project root is in the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logger = logging.getLogger(__name__)


def main():
    """Start the Flask-SocketIO application."""
    try:
        logger.info("Starting Chat Application...")

        # Create application instance
        app, socketio = create_app()

        # Get configuration
        port = app.config.get("PORT", 5000)
        debug = app.config.get("DEBUG", False)
        env = app.config.get("FLASK_ENV", "development")

        logger.info(
            f"Starting server on port {port} in {env} mode (debug={debug})"
        )

        # Run with Eventlet (production-ready WSGI server)
        socketio.run(
            app,
            host="0.0.0.0",
            port=port,
            debug=debug,
            use_reloader=debug,
            log_output=True,
        )

    except KeyboardInterrupt:
        logger.info("Server interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

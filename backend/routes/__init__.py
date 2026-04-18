"""API routes for the Chat Application."""

from flask import Blueprint


def register_blueprints(app):
    """
    Register all route blueprints with the Flask app.

    Args:
        app: Flask application instance.
    """
    from .auth import auth_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")

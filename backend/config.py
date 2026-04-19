"""
Configuration management for the Chat Application.

This module loads environment variables and provides configuration
for different deployment environments (development, testing, production).
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration class with common settings."""

    # Flask
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "yes")
    PORT = int(os.getenv("PORT", 5000))

    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "chat_app")

    # JWT Configuration
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY", "change-me-to-a-secure-random-string-in-production"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ALGORITHM = "HS256"

    # CORS Configuration
    _cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5000,http://localhost:3000")
    CORS_ORIGINS = [origin.strip() for origin in _cors_origins.split(",")]
    
    # Socket.IO Configuration
    SOCKETIO_CORS_ALLOWED_ORIGINS = CORS_ORIGINS
    SOCKETIO_MESSAGE_QUEUE = None
    SOCKETIO_ASYNC_MODE = "eventlet"
    SOCKETIO_ENGINEIO_LOGGER = False
    SOCKETIO_LOGGER = False

    # Application
    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    """Development environment configuration."""

    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """Testing environment configuration."""

    DEBUG = True
    TESTING = True


class ProductionConfig(Config):
    """Production environment configuration."""

    DEBUG = False
    TESTING = False


def get_config():
    """
    Get the appropriate configuration based on FLASK_ENV.

    Returns:
        Config: Configuration class based on environment.
    """
    env = os.getenv("FLASK_ENV", "development").lower()
    config_map = {
        "development": DevelopmentConfig,
        "testing": TestingConfig,
        "production": ProductionConfig,
    }
    return config_map.get(env, DevelopmentConfig)

@echo off
REM Setup script for Chat Application Backend (Windows)

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Chat Application Backend - Setup Script
echo ========================================
echo.

REM Check Python version
echo Checking Python version...
python --version > nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

python --version

REM Create virtual environment
if not exist "venv" (
    echo.
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created
) else (
    echo Virtual environment already exists
)

REM Activate virtual environment
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo.
echo Upgrading pip...
python -m pip install --upgrade pip setuptools wheel > nul 2>&1

REM Install dependencies
echo.
echo Installing dependencies from requirements.txt...
pip install -r requirements.txt

REM Verify imports
echo.
echo Verifying package installations...

python << EOF
try:
    import flask
    print("   [OK] Flask")
    import flask_socketio
    print("   [OK] Flask-SocketIO")
    import pymongo
    print("   [OK] PyMongo")
    import flask_jwt_extended
    print("   [OK] Flask-JWT-Extended")
    import flask_cors
    print("   [OK] Flask-CORS")
    import eventlet
    print("   [OK] Eventlet")
    import dotenv
    print("   [OK] python-dotenv")
except ImportError as e:
    print(f"   [ERROR] Import error: {e}")
    exit(1)
EOF

REM Check .env file
echo.
echo Checking environment configuration...
if exist ".env" (
    echo [OK] .env file found
    
    findstr "MONGO_URI" .env > nul
    if !errorlevel! equ 0 (
        echo   [OK] MONGO_URI configured
    ) else (
        echo   [ERROR] MONGO_URI not found in .env
    )
) else (
    echo [ERROR] .env file not found
    echo Please create .env file with:
    echo   MONGO_URI=your_mongodb_connection_string
    echo   JWT_SECRET_KEY=your_secret_key
    echo   PORT=5000
)

REM Test MongoDB connection
echo.
echo Testing MongoDB connection...

python << EOF
import sys
sys.path.insert(0, '.')
try:
    from utils.db import MongoDBConnection
    from config import get_config
    
    config = get_config()
    db = MongoDBConnection.connect(config.MONGO_URI, config.DATABASE_NAME)
    MongoDBConnection.initialize_indexes()
    print("   [OK] MongoDB connection successful!")
    print("   [OK] Database indexes created")
except Exception as e:
    print(f"   [ERROR] MongoDB connection failed: {e}")
    print("   [WARNING] Ensure MONGO_URI is correct in .env")
EOF

REM Display setup summary
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo   1. Activate virtual environment:
echo      venv\Scripts\activate
echo.
echo   2. Start the server:
echo      python run.py
echo.
echo   3. Open in browser:
echo      http://localhost:5000/
echo.
echo   4. Read README.md for more details
echo.
echo Happy coding!
echo.
pause

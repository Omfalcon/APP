#!/bin/bash
#
# Setup script for Chat Application Backend
#
# This script automates the initial setup process:
# 1. Create virtual environment
# 2. Install dependencies
# 3. Verify MongoDB connection
# 4. Display setup summary
#

set -e

echo "🚀 Chat Application Backend - Setup Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python version
echo "📋 Checking Python version..."
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "   Python $PYTHON_VERSION found"

if ! python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)'; then
    echo -e "${RED}✗ Python 3.8+ required${NC}"
    exit 1
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}⚠ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo ""
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "📥 Upgrading pip..."
pip install --upgrade pip setuptools wheel > /dev/null 2>&1

# Install dependencies
echo ""
echo "📥 Installing dependencies from requirements.txt..."
pip install -r requirements.txt

# Verify imports
echo ""
echo "✅ Verifying package installations..."

python3 << EOF
try:
    import flask
    print("   ✓ Flask")
    import flask_socketio
    print("   ✓ Flask-SocketIO")
    import pymongo
    print("   ✓ PyMongo")
    import flask_jwt_extended
    print("   ✓ Flask-JWT-Extended")
    import flask_cors
    print("   ✓ Flask-CORS")
    import eventlet
    print("   ✓ Eventlet")
    import dotenv
    print("   ✓ python-dotenv")
except ImportError as e:
    print(f"   ✗ Import error: {e}")
    exit(1)
EOF

# Check .env file
echo ""
echo "📝 Checking environment configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
    
    # Verify MONGO_URI
    if grep -q "MONGO_URI" .env; then
        echo -e "${GREEN}   ✓ MONGO_URI configured${NC}"
    else
        echo -e "${RED}   ✗ MONGO_URI not found in .env${NC}"
    fi
else
    echo -e "${RED}✗ .env file not found${NC}"
    echo "  Please create .env file with:"
    echo "    MONGO_URI=your_mongodb_connection_string"
    echo "    JWT_SECRET_KEY=your_secret_key"
    echo "    PORT=5000"
fi

# Test MongoDB connection
echo ""
echo "🔌 Testing MongoDB connection..."

python3 << EOF
import sys
sys.path.insert(0, '.')
try:
    from utils.db import MongoDBConnection
    from config import get_config
    
    config = get_config()
    db = MongoDBConnection.connect(config.MONGO_URI, config.DATABASE_NAME)
    MongoDBConnection.initialize_indexes()
    print("   ✓ MongoDB connection successful!")
    print("   ✓ Database indexes created")
except Exception as e:
    print(f"   ✗ MongoDB connection failed: {e}")
    print("   ⚠ Ensure MONGO_URI is correct in .env")
EOF

# Display setup summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📖 Next Steps:"
echo "   1. Activate virtual environment:"
echo "      source venv/bin/activate"
echo ""
echo "   2. Start the server:"
echo "      python run.py"
echo ""
echo "   3. Open test client:"
echo "      open test.html"
echo ""
echo "   4. Navigate to:"
echo "      http://localhost:5000/health"
echo ""
echo "📚 Documentation:"
echo "   Read README.md for complete setup instructions"
echo ""
echo "Happy coding! 🚀"
echo ""

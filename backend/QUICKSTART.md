# Quick Start Guide

Get the Chat Application running in under 5 minutes.

## 1️⃣ One-Time Setup

```bash
cd /Users/ganeshnikhil/app/backend

# Make setup script executable (macOS/Linux)
chmod +x setup.sh

# Run setup
./setup.sh
```

This will:
- Create a Python virtual environment
- Install all dependencies
- Verify MongoDB connection
- Create database indexes

## 2️⃣ Start the Server

```bash
# Activate virtual environment (if not already active)
source venv/bin/activate

# Start the backend
python run.py
```

Expected output:
```
INFO:__main__:Starting Chat Application...
INFO:__main__:Starting server on port 5000 in development mode (debug=True)
 * Running on http://0.0.0.0:5000
```

## 3️⃣ Open Test Client

In another terminal (or new browser tab):
```bash
# macOS
open test.html

# Linux
xdg-open test.html

# Or manually open file in browser:
file:///Users/ganeshnikhil/app/backend/test.html
```

## 4️⃣ Test the Application

### In test.html:

**Tab 1 (User 1):**
1. Enter username: `alice`
2. Enter password: `pass123`
3. Click **Sign Up**
4. Click **Connect WebSocket**

**Tab 2 or Incognito Window (User 2):**
1. Enter username: `bob`
2. Enter password: `pass456`
3. Click **Sign Up**
4. Click **Connect WebSocket**

**Send Messages:**
1. In Tab 1, select `bob` from dropdown
2. Type message: "Hello Bob!"
3. Click **Send Message**
4. See message appear in Tab 2 instantly

**View Chat History:**
1. Click **Load Chat History**
2. See all messages between users

**Test WebRTC:**
1. Select target user
2. Click **Initiate Call**
3. Other user sees incoming call
4. Test offer/answer/ICE signaling

## 📊 Verify Everything Works

### Health Check
```bash
curl http://localhost:5000/health
# Response: {"status":"ok","message":"Chat API is running"}
```

### MongoDB
```bash
# View collections and data
mongosh "mongodb+srv://..." --authenticationDatabase admin
> use chat_app
> db.users.find()
> db.messages.find()
```

1. Change `JWT_SECRET_KEY` in .env:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. Set `FLASK_ENV=production`

3. Update `CORS_ORIGINS` to your domain

4. Deploy using Docker or cloud platform (see README.md)

---

**Ready? Start with:** `./setup.sh` then `python run.py`

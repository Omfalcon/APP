# Real-Time Chat Application - Backend

Flask backend for real-time chatting with WebSocket, JWT authentication, and MongoDB.

## 🚀 Quick Start

**Prerequisites:** Python 3.8+, MongoDB

### 1. Run Setup

**macOS/Linux:**
```bash
chmod +x setup.sh && ./setup.sh
```

**Windows:**
```bash
setup.bat
```

### 2. Start Server

```bash
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows
python run.py
```

Server runs at: **http://localhost:5001**

### 3. Access Frontend

Open **http://localhost:5001** in browser

### Verify Installations
```bash
python --version          # Should be 3.8+
pip --version             # Should be 20.0+
mongosh --version         # Optional, for MongoDB validation
```

---

## 🔧 Installation & Setup

### 1. Clone/Navigate to Project
```bash
cd /Users/ganeshnikhil/app/backend
```

### 2. Create Python Virtual Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Verify Environment Configuration
The `.env` file should already contain:
```
MONGO_URI=mongodb+srv://...
DATABASE_NAME=chat_app
FLASK_ENV=development
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production-to-a-secure-random-string
PORT=5000
CORS_ORIGINS=http://localhost:3000,http://localhost:5000,http://127.0.0.1:5000
```

**⚠️ Important:** In production, change `JWT_SECRET_KEY` to a secure random string:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Test MongoDB Connection
```bash
python -c "
from utils.db import MongoDBConnection
from config import get_config

config = get_config()
try:
    db = MongoDBConnection.connect(config.MONGO_URI, config.DATABASE_NAME)
    MongoDBConnection.initialize_indexes()
    print('✓ MongoDB connection successful!')
except Exception as e:
    print(f'✗ MongoDB connection failed: {e}')
"
```

---

## 🔧 Setup Environment

Create `.env` file:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chat_app
DATABASE_NAME=chat_app
FLASK_ENV=development
JWT_SECRET_KEY=your-secret-key
PORT=5001
CORS_ORIGINS=http://localhost:5001,http://127.0.0.1:5001
```

---

## 📡 API Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login to account |
| GET | `/api/auth/users` | Get all users |
| GET | `/health` | Server status |

### Signup
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "pass123"}'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "pass123"}'
```

---

## 🔌 WebSocket Events

Connect:
```javascript
const socket = io('http://localhost:5001', {
  query: { token: jwtToken }
});
```

### Chat Events

| Event | Purpose |
|-------|---------|
| `send_message` | Send message to user |
| `receive_message` | Receive message |
| `get_chat_history` | Fetch previous messages |
| `active_users` | List online users |

### WebRTC Events

| Event | Purpose |
|-------|---------|
| `webrtc_call_request` | Start call |
| `webrtc_signal` | Send offer/answer/ICE |
| `webrtc_call_accept` | Accept call |
| `webrtc_call_reject` | Reject call |

---

## 🧪 Testing

1. Open **http://localhost:5001** in browser
2. Sign up as **User 1**
3. Open **http://localhost:5001** in another tab (incognito)
4. Sign up as **User 2**
5. Click user in sidebar to chat

---

## 📁 Project Structure

```
backend/
├── run.py                 # Server entry point
├── app.py                 # Flask app factory
├── index.html             # Frontend
├── test.html              # Developer test client
├── requirements.txt       # Dependencies
├── .env                   # Configuration
│
├── models/
│   ├── user.py
│   └── message.py
│
├── routes/
│   └── auth.py
│
├── sockets/
│   ├── chat.py
│   └── webrtc.py
│
└── utils/
    ├── db.py
    └── jwt_utils.py
```

---

## ▶️ Running the Application

### Development Mode
```bash
python run.py
```

Expected output:
```
INFO:__main__:Starting Chat Application...
* Running on http://0.0.0.0:5001
```

### With Custom Port
```bash
export PORT=8000    # macOS/Linux
set PORT=8000       # Windows
python run.py
```

### Health Check
```bash
curl http://localhost:5001/health
```

---

## 🔐 API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. **Signup**
```http
POST /api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "john_doe"
}
```

**Error (409 Conflict):**
```json
{
  "error": "Username 'john_doe' already exists"
}
```

#### 2. **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "john_doe"
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Invalid username or password"
}
```

#### 3. **Get All Users**
```http
GET /api/auth/users
```

**Response (200 OK):**
```json
{
  "users": [
    {"username": "jane_doe", "id": "507f1f77bcf86cd799439011"},
    {"username": "john_doe", "id": "507f1f77bcf86cd799439012"}
  ]
}
```

---

## 🔌 WebSocket Events

### Connection
```javascript
// Connect with JWT token
socket = io('http://localhost:5000', {
  query: { token: jwtToken }
});
```

### Chat Events

#### **Send Message**
```javascript
socket.emit('send_message', {
  sender: 'john_doe',
  receiver: 'jane_doe',
  content: 'Hello Jane!'
});

// Listens for:
socket.on('message_sent', (data) => {
  console.log('Message confirmed:', data);
});

socket.on('receive_message', (data) => {
  console.log(`Message from ${data.sender}: ${data.content}`);
});
```

#### **Get Chat History**
```javascript
socket.emit('get_chat_history', {
  user1: 'john_doe',
  user2: 'jane_doe',
  limit: 50
});

socket.on('chat_history', (data) => {
  console.log('Messages:', data.messages);
});
```

#### **Active Users**
```javascript
socket.on('active_users', (data) => {
  console.log('Online users:', data.users); // ['john_doe', 'jane_doe']
});

socket.on('user_joined', (data) => {
  console.log(`${data.username} has joined`);
});

socket.on('user_left', (data) => {
  console.log(`${data.username} has left`);
});
```

#### **Typing Indicators**
```javascript
socket.emit('typing', {
  from_user: 'john_doe',
  to_user: 'jane_doe'
});

socket.on('user_typing', (data) => {
  console.log(`${data.from_user} is typing...`);
});
```

### WebRTC Signaling Events

#### **Call Initiation**
```javascript
socket.emit('webrtc_call_request', {
  from_user: 'john_doe',
  to_user: 'jane_doe'
});

socket.on('webrtc_call_incoming', (data) => {
  console.log(`Incoming call from ${data.from_user}`);
});
```

#### **WebRTC Signal Exchange**
```javascript
// Send offer/answer/ICE candidate
socket.emit('webrtc_signal', {
  from_user: 'john_doe',
  to_user: 'jane_doe',
  signal_type: 'offer', // 'offer' | 'answer' | 'ice-candidate'
  data: {
    type: 'offer',
    sdp: 'v=0\r\no=- 123456789 ...'
  }
});

socket.on('webrtc_offer', (data) => {
  console.log('Received offer from:', data.from_user);
});

socket.on('webrtc_answer', (data) => {
  console.log('Received answer from:', data.from_user);
});

socket.on('webrtc_ice_candidate', (data) => {
  console.log('ICE candidate from:', data.from_user);
});
```

#### **Call Control**
```javascript
// Accept call
socket.emit('webrtc_call_accept', {
  connection_id: 'conn_123',
  from_user: 'jane_doe'
});

// Reject call
socket.emit('webrtc_call_reject', {
  connection_id: 'conn_123',
  reason: 'User rejected'
});

// End call
socket.emit('webrtc_call_end', {
  connection_id: 'conn_123'
});
```

---

## 🧪 Testing with test.html

### Quick Start
1. **Start the backend:**
   ```bash
   python run.py
   ```

2. **Open test.html in a browser:**
   ```bash
   open test.html
   # Or navigate to: file:///Users/ganeshnikhil/app/backend/test.html
   ```

### Testing Workflow

#### Step 1: Authentication
1. Open the test.html in your browser
2. **Signup** as first user (e.g., "user1" with password "pass123")
3. **Logout** or open a new browser tab/window in incognito mode
4. **Login** as second user (e.g., "user2" with password "pass456") OR signup as user2

#### Step 2: WebSocket Connection
1. In each user's browser, click **"Connect WebSocket"**
2. Verify status shows "Connected ✓"
3. Observe "Online Users" list updates in real-time

#### Step 3: Real-Time Chat
1. **Select target user** in the "Send Message" section
2. **Type a message** and click "Send Message"
3. **Observe in other user's browser** - message appears in real-time
4. **Load chat history** to verify message persistence in MongoDB

#### Step 4: WebRTC Signaling Testing
1. **Select target user** in WebRTC section
2. Click **"Initiate Call"** to send a call request
3. **In receiving browser**, observe "Incoming call" notification
4. Click **"Accept Call"** or **"Reject Call"**
5. **Send WebRTC signals** (copy-paste SDP/ICE data):
   ```json
   {
     "type": "offer",
     "sdp": "v=0\r\no=- 123..."
   }
   ```

#### Debugging
- **Check browser console:** Press `F12` → Console tab
- **View server logs:** Terminal running `python run.py`
- **Monitor database:** Use MongoDB Atlas UI or `mongosh`

---

## 🚀 Deployment

### Production Checklist
- [ ] Set `FLASK_ENV=production`
- [ ] Generate and set secure `JWT_SECRET_KEY`
- [ ] Update `CORS_ORIGINS` to your frontend domain
- [ ] Use production MongoDB URI (Atlas recommended)
- [ ] Enable MongoDB authentication
- [ ] Use strong database credentials
- [ ] Configure logging to files/service

### Docker Deployment

#### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["python", "run.py"]
```

#### Build and Run
```bash
docker build -t chat-app-backend .
docker run -p 5000:5000 \
  -e MONGO_URI="mongodb+srv://..." \
  -e JWT_SECRET_KEY="your-secure-key" \
  chat-app-backend
```

### Cloud Deployment (AWS/GCP/Azure)

#### 1. **AWS Elastic Beanstalk**
```bash
eb init -p python-3.11 chat-app
eb create chat-app-env
eb deploy
```

#### 2. **Google Cloud Run**
```bash
gcloud run deploy chat-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### 3. **Heroku** (Legacy)
```bash
heroku login
heroku create chat-app
git push heroku main
```

### Environment Variables (Production)
Set these in your deployment platform:
```
FLASK_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/chat_app
JWT_SECRET_KEY=<generated-secure-key>
DATABASE_NAME=chat_app
PORT=5000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 🏗️ Architecture & Best Practices

### Modular Design Principles

#### 1. **Separation of Concerns**
- **routes/**: REST API endpoints
- **sockets/**: WebSocket event handlers
- **models/**: Database interactions
- **utils/**: Cross-cutting utilities
- **config.py**: Environment-specific settings

#### 2. **Factory Pattern**
The `app.py` module uses Flask's application factory pattern:
```python
app, socketio = create_app()
```

This allows:
- Multiple app instances for testing
- Easy configuration switching
- Clean initialization flow

#### 3. **Error Handling**
- Try-catch in routes and handlers
- Proper HTTP status codes (400, 401, 409, 500)
- Structured error responses
- Comprehensive logging

#### 4. **Authentication & Authorization**
- JWT tokens stored in request headers
- Socket.IO auth via query parameters
- Password hashing with Werkzeug
- Token expiration (30 days default)

#### 5. **Database Best Practices**
- Connection pooling (PyMongo default)
- Indexed queries for performance
- Unique constraints on usernames
- Clean data model separation

#### 6. **Logging**
```python
import logging
logger = logging.getLogger(__name__)
logger.info("User created")
logger.error("Database error")
```

#### 7. **PEP-8 Compliance**
- 4-space indentation
- Clear variable names
- Docstrings on functions/classes
- Type hints where beneficial

---

## 📊 Database Schema

### Collections

#### **users**
```json
{
  "_id": ObjectId("..."),
  "username": "john_doe",
  "password_hash": "sha256$...",
  "created_at": ISODate("2024-01-15T10:30:00Z")
}
```

**Indexes:**
- `username` (unique)

#### **messages**
```json
{
  "_id": ObjectId("..."),
  "sender": "john_doe",
  "receiver": "jane_doe",
  "content": "Hello!",
  "timestamp": ISODate("2024-01-15T10:35:00Z"),
  "is_read": false
}
```

**Indexes:**
- `sender`
- `receiver`
- `timestamp`
- Compound: `sender` + `receiver`

---

## 🔒 Security Considerations

### Implemented
✅ Password hashing (Werkzeug)
✅ JWT authentication
✅ CORS policy enforcement
✅ Input validation
✅ SQL injection protection (uses PyMongo)
✅ Error messages don't expose internals

### Recommendations for Production
1. **HTTPS/TLS**: Use reverse proxy (Nginx/Apache)
2. **Rate Limiting**: Add Flask-Limiter
3. **Database Auth**: Enable MongoDB authentication
4. **Secrets Management**: Use AWS Secrets Manager, HashiCorp Vault
5. **Monitoring**: Add Sentry, DataDog, or similar
6. **API Keys**: Implement for external integrations
7. **Audit Logging**: Log authentication events

---

## 🐛 Troubleshooting

### "Connection refused" on WebSocket
```
✓ Verify backend is running: python run.py
✓ Check port 5000 is not in use: lsof -i :5000
✓ Verify CORS_ORIGINS in .env includes localhost
```

### "MONGO_URI not found"
```
✓ Verify .env file exists in project root
✓ Check python-dotenv is installed: pip install python-dotenv
✓ Restart Python process after editing .env
```

### JWT token expired
```
✓ Tokens expire after 30 days (config.py: JWT_ACCESS_TOKEN_EXPIRES)
✓ User must login again to get new token
✓ Modify expiration in config.py if needed
```

### Messages not persisting
```
✓ Verify MongoDB connection is active
✓ Check messages collection exists in chat_app database
✓ Verify indexes are created: python run.py (first startup)
✓ Check MongoDB storage is not full
```

---

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com)
- [Flask-SocketIO Guide](https://flask-socketio.readthedocs.io)
- [PyMongo Reference](https://pymongo.readthedocs.io)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

## 📝 License

This project is provided as-is for educational and development purposes.

---

## 👨‍💻 Support & Contributing

For issues or improvements, please ensure:
1. All tests pass
2. Code follows PEP-8
3. Clear commit messages
4. Documentation is updated

---

**Happy coding! 🚀**

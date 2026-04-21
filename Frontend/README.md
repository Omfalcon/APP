# Chat Application - React Frontend

A modern, real-time chat application frontend built with React, Vite, and Tailwind CSS. Features peer-to-peer messaging via WebRTC and Socket.IO signaling.

## 🚀 Features

- **Modern Authentication** - Login/Signup with JWT tokens
- **Real-time Messaging** - Socket.IO-based instant messaging
- **User Discovery** - Browse and search all registered users
- **WebRTC Ready** - Infrastructure for peer-to-peer communication
- **Responsive Design** - Mobile-friendly UI with Tailwind CSS
- **Environment Configuration** - Easy setup for development and production

## 📋 Prerequisites

- Node.js v16+ and npm/yarn
- React 18+
- Active backend instance (Flask backend at `/backend`)

## 🛠️ Local Development Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the frontend directory:

```bash
# Environment
VITE_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000` with hot-reload enabled.

### 4. Run Backend in Parallel

In a separate terminal:

```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```

Backend will run on `http://localhost:5000`

## 🏗️ Project Structure

```
frontend/
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
├── vercel.json             # Vercel deployment config (React Router rewrites)
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── package.json
├── .env.local              # Local development env vars
├── .env.example            # Environment template
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Main router component
    ├── index.css           # Global styles + Tailwind
    ├── contexts/
    │   └── AuthContext.jsx # Authentication state management
    ├── pages/
    │   ├── AuthPage.jsx    # Login/Signup page
    │   └── ChatPage.jsx    # Main chat interface
    ├── components/
    │   ├── UserList.jsx    # User list sidebar
    │   ├── ChatWindow.jsx  # Message display area
    │   └── MessageInput.jsx # Message input form
    ├── hooks/
    │   ├── useSocket.js    # Socket.IO hook
    │   └── useWebRTC.js    # WebRTC connection hook
    ├── services/
    │   ├── api.js          # Axios API client
    │   └── socket.js       # Socket.IO client
    └── utils/
        └── constants.js    # API endpoints & Socket.IO events
```

## 📡 API Integration

### REST Endpoints (Backend: `/api/auth/*`)

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/auth/signup` | POST | Register new user | `{token, username}` |
| `/api/auth/login` | POST | User login | `{token, username}` |
| `/api/auth/users` | GET | Get all users | `{users: [{username, id}]}` |
| `/api/auth/me` | GET | Current user (protected) | `{username, id}` |

### Socket.IO Events

**Connection:**
```javascript
// Connect with JWT
socket = io(SOCKET_URL, {
  query: { token: jwtToken }
});
```

**Chat Events:**
- `send_message` - Send a message
- `receive_message` - Receive incoming message
- `get_chat_history` - Fetch conversation history
- `active_users` - Get online users list

**WebRTC Events:**
- `webrtc_signal` - Route WebRTC signals (offer/answer/ice-candidate)
- `webrtc_call_request` - Initiate call
- `webrtc_call_incoming` - Incoming call notification

## 🔐 Authentication Flow

1. **Login/Signup** → POST to `/api/auth/login` or `/api/auth/signup`
2. **Store JWT** → Save token in localStorage
3. **Socket Connection** → Connect to Socket.IO with JWT query param
4. **Backend Verification** → Backend validates token in `handle_connect`

## 🌐 Deployment to Vercel

### Step 1: Prepare Backend for Production

Update `backend/.env`:
```env
CORS_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app,http://localhost:3000
FLASK_ENV=production
FLASK_DEBUG=False
```

Deploy backend (e.g., Heroku, Railway, or your preferred platform):
```bash
cd backend
# Follow your hosting platform's deployment guide
```

### Step 2: Configure Frontend for Vercel

Update `frontend/.env.production` (create new file):
```env
VITE_ENV=production
```

### Step 3: Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
npm install -g vercel
cd frontend
vercel
```

Follow prompts and configure:
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

**Option B: GitHub Integration**

1. Push frontend code to GitHub
2. Connect repository to Vercel dashboard
3. Set Environment Variables in Vercel settings
4. Vercel auto-deploys on push

Configure backend settings if necessary in `src/config/api.js`.

## 🔍 Troubleshooting

### CORS Errors

**Problem:** "Access to XMLHttpRequest blocked by CORS policy"

**Solution:** Ensure backend `CORS_ORIGINS` includes your frontend URL:
```env
# backend/.env
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

### Socket.IO Connection Failed

**Problem:** "WebSocket connection failed"

**Solution:** Verify Socket.IO URL and ensure backend is running
```javascript
// src/config/api.js
export const SOCKET_URL = ...;
```

### 401 Unauthorized on Protected Routes

**Problem:** "Missing authorization token"

**Solution:** Ensure JWT is stored and sent in request headers
```javascript
// src/services/api.js - Interceptor adds Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🚀 Build for Production

```bash
npm run build
```

Creates optimized build in `dist/` directory. Preview locally:

```bash
npm run preview
```

## 📚 Key Technologies

- **React 18** - UI framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **Zustand** - State management (future enhancement)

## 🔗 Backend Integration Points

### Authentication Flow
1. Frontend sends credentials to `POST /api/auth/login`
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. Subsequent requests include `Authorization: Bearer <token>` header
5. Socket.IO connection uses token as query parameter

### Real-time Messaging
1. Frontend emits `send_message` via Socket.IO
2. Backend saves to MongoDB and broadcasts to receiver
3. Receiver socket receives `receive_message` event
4. Frontend updates message list in real-time

### User Discovery
1. Frontend fetches `GET /api/auth/users` on mount
2. Populates user list in sidebar
3. Users can search and select contacts

## 📖 Development Tips

- **Hot Module Replacement** - Changes auto-reflect without reload
- **Network Inspection** - Open DevTools → Network tab to debug Socket.IO
- **Local Storage** - Check DevTools → Application → Local Storage for JWT
- **Error Handling** - All API errors logged to console with context

## 📝 License

This project is part of a cohort chat application for educational purposes.

---

**Questions?** Check backend [QUICKSTART.md](../backend/QUICKSTART.md) or review Socket.IO event handlers in `src/hooks/useSocket.js`.

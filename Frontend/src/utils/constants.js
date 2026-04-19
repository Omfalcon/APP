export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/api/auth/signup',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    USERS: '/api/auth/users',
    GROUP_MESSAGES: '/api/auth/group-messages',
  },
};

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Chat events
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  GET_CHAT_HISTORY: 'get_chat_history',
  CHAT_HISTORY: 'chat_history',
  ACTIVE_USERS: 'active_users',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  MESSAGE_SENT: 'message_sent',

  // Global group chat events
  JOIN_GLOBAL_ROOM: 'join_global_room',
  LEAVE_GLOBAL_ROOM: 'leave_global_room',
  SEND_GLOBAL_MESSAGE: 'send_global_message',
  RECEIVE_GLOBAL_MESSAGE: 'receive_global_message',
  GLOBAL_USER_JOINED: 'global_user_joined',
  GLOBAL_USER_LEFT: 'global_user_left',

  // WebRTC call events
  CALL_REQUEST: 'webrtc_call_request',
  CALL_INCOMING: 'webrtc_call_incoming',
  CALL_ACCEPT: 'webrtc_call_accept',
  CALL_ACCEPTED: 'webrtc_call_accepted',
  CALL_REJECT: 'webrtc_call_reject',
  CALL_REJECTED: 'webrtc_call_rejected',
  CALL_END: 'webrtc_call_end',
  CALL_ENDED: 'webrtc_call_ended',

  // WebRTC signaling
  SIGNAL: 'webrtc_signal',
  OFFER: 'webrtc_offer',
  ANSWER: 'webrtc_answer',
  ICE_CANDIDATE: 'webrtc_ice_candidate',

  // Error
  ERROR: 'error',
};

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

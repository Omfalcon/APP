import { io } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS } from '../utils/constants';

let socket = null;

export const initializeSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    query: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log('Socket.IO connected');
  });

  socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
    console.error('Socket.IO connection error:', error);
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log('Socket.IO disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const emitEvent = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data);
  } else {
    console.warn(`Socket not connected. Cannot emit event: ${event}`);
  }
};

export const onEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const offEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

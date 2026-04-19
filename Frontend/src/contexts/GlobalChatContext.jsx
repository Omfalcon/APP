import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { SOCKET_EVENTS } from '../utils/constants';

const GlobalChatContext = createContext();

export const GlobalChatProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInGlobalRoom, setIsInGlobalRoom] = useState(false);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [globalUsers, setGlobalUsers] = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Initialize socket connection listeners for global chat
  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    // Handle socket connection
    const handleConnect = () => {
      console.log('Global Chat: Socket.IO connected');
      setIsConnected(true);
      setReconnectAttempts(0);

      // Automatically join global room if user is in chat
      if (isInGlobalRoom) {
        socket.emit(SOCKET_EVENTS.JOIN_GLOBAL_ROOM);
      }
    };

    // Handle socket disconnection
    const handleDisconnect = () => {
      console.log('Global Chat: Socket.IO disconnected');
      setIsConnected(false);
      setIsInGlobalRoom(false);
      
      // NOTE: WebRTC connections are NOT cleared here - they continue to work
      // This ensures 1-on-1 chats remain functional even if the backend goes down
    };

    // Handle connection error
    const handleConnectError = (error) => {
      console.error('Global Chat: Connection error:', error);
      setIsConnected(false);
      setReconnectAttempts((prev) => Math.min(prev + 1, 5));
    };

    // Handle receiving global messages
    const handleReceiveGlobalMessage = (data) => {
      const { message_id, sender, content, timestamp } = data;
      setGlobalMessages((prev) => [
        ...prev,
        {
          _id: message_id,
          sender_username: sender,
          content,
          timestamp,
        },
      ]);
    };

    // Handle user joining global room
    const handleGlobalUserJoined = (data) => {
      const { username, active_users } = data;
      console.log(`${username} joined global chat`);
      setGlobalUsers(active_users || []);
    };

    // Handle user leaving global room
    const handleGlobalUserLeft = (data) => {
      const { username, active_users } = data;
      console.log(`${username} left global chat`);
      setGlobalUsers(active_users || []);
    };

    // Register event listeners
    socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
    socket.on(SOCKET_EVENTS.RECEIVE_GLOBAL_MESSAGE, handleReceiveGlobalMessage);
    socket.on(SOCKET_EVENTS.GLOBAL_USER_JOINED, handleGlobalUserJoined);
    socket.on(SOCKET_EVENTS.GLOBAL_USER_LEFT, handleGlobalUserLeft);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      socket.off(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
      socket.off(SOCKET_EVENTS.RECEIVE_GLOBAL_MESSAGE, handleReceiveGlobalMessage);
      socket.off(SOCKET_EVENTS.GLOBAL_USER_JOINED, handleGlobalUserJoined);
      socket.off(SOCKET_EVENTS.GLOBAL_USER_LEFT, handleGlobalUserLeft);
    };
  }, [isInGlobalRoom]);

  /**
   * Join the global chat room
   * CRITICAL: This only joins if the socket is connected
   */
  const joinGlobalRoom = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) {
      console.log('Joining global chat room');
      socket.emit(SOCKET_EVENTS.JOIN_GLOBAL_ROOM);
      setIsInGlobalRoom(true);
    } else {
      console.warn('Cannot join global room: Socket not connected');
      setIsInGlobalRoom(false);
    }
  }, []);

  /**
   * Leave the global chat room
   */
  const leaveGlobalRoom = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) {
      console.log('Leaving global chat room');
      socket.emit(SOCKET_EVENTS.LEAVE_GLOBAL_ROOM);
    }
    setIsInGlobalRoom(false);
  }, []);

  /**
   * Send a message to the global chat
   * CRITICAL: This only works if socket is connected
   * If socket is disconnected, this will fail gracefully
   */
  const sendGlobalMessage = useCallback((sender, content) => {
    const socket = getSocket();
    
    if (!socket?.connected) {
      const error = 'Cannot send message: Server disconnected. Attempting to reconnect...';
      console.warn(error);
      throw new Error(error);
    }

    socket.emit(SOCKET_EVENTS.SEND_GLOBAL_MESSAGE, {
      sender,
      content,
    });
  }, []);

  /**
   * Add messages from history (called when loading from API)
   */
  const setHistoryMessages = useCallback((messages) => {
    setGlobalMessages(messages);
  }, []);

  /**
   * Clear all messages (for testing)
   */
  const clearMessages = useCallback(() => {
    setGlobalMessages([]);
  }, []);

  const value = {
    // State
    isConnected,
    isInGlobalRoom,
    globalMessages,
    globalUsers,
    reconnectAttempts,

    // Methods
    joinGlobalRoom,
    leaveGlobalRoom,
    sendGlobalMessage,
    setHistoryMessages,
    clearMessages,
  };

  return (
    <GlobalChatContext.Provider value={value}>
      {children}
    </GlobalChatContext.Provider>
  );
};

/**
 * Hook to use global chat context
 * CRITICAL FAULT TOLERANCE:
 * - If socket is disconnected (isConnected === false):
 *   - Global chat UI should display "Disconnected" warning
 *   - Message sending will throw an error
 *   - WebRTC 1-on-1 chats continue working (not affected by socket state)
 * - When socket reconnects, the app should automatically rejoin global room
 */
export const useGlobalChat = () => {
  const context = useContext(GlobalChatContext);
  if (!context) {
    throw new Error('useGlobalChat must be used within GlobalChatProvider');
  }
  return context;
};

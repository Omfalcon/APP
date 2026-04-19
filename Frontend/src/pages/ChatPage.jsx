import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalChat } from '../contexts/GlobalChatContext';
import { authAPI, groupChatAPI, messageAPI } from '../services/api';
import { useSocket, useEmit } from '../hooks/useSocket';
import UserList from '../components/UserList';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import { SOCKET_EVENTS } from '../utils/constants';

// Special ID for global chat
const GLOBAL_CHAT_ID = '__GLOBAL_CHAT__';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const emit = useEmit();
  const {
    isConnected: globalChatConnected,
    joinGlobalRoom,
    leaveGlobalRoom,
    sendGlobalMessage,
    globalMessages,
    setHistoryMessages,
  } = useGlobalChat();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);

  const messagesRef = useRef({});

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authAPI.getUsers();
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle active users list
  useSocket(SOCKET_EVENTS.ACTIVE_USERS, (data) => {
    setActiveUsers(data.users || []);
  });

  // Handle user joined
  useSocket(SOCKET_EVENTS.USER_JOINED, (data) => {
    console.log(`${data.username} joined the chat`);
  });

  // Handle user left
  useSocket(SOCKET_EVENTS.USER_LEFT, (data) => {
    console.log(`${data.username} left the chat`);
  });

  // Handle incoming messages
  useSocket(SOCKET_EVENTS.RECEIVE_MESSAGE, (data) => {
    const { sender, receiver, content, timestamp, message_id } = data;
    const conversationKey = [sender, receiver].sort().join('_');

    const message = {
      sender,
      receiver,
      content,
      timestamp,
      message_id,
    };

    messagesRef.current[conversationKey] = [
      ...(messagesRef.current[conversationKey] || []),
      message,
    ];

    // Only update UI if this is for the currently selected 1-on-1 conversation
    if (selectedUser && selectedUser !== GLOBAL_CHAT_ID) {
      const selectedConvKey = [user?.username, selectedUser].sort().join('_');
      if (conversationKey === selectedConvKey) {
        setMessages((prev) => ({
          ...prev,
          [conversationKey]: messagesRef.current[conversationKey],
        }));
      }
    }
  });

  // Handle chat history
  useSocket(SOCKET_EVENTS.CHAT_HISTORY, (data) => {
    const { user1, user2, messages: historyMessages } = data;
    const conversationKey = [user1, user2].sort().join('_');

    // Store in ref for persistence when switching users
    messagesRef.current[conversationKey] = historyMessages || [];
    setMessages((prev) => ({
      ...prev,
      [conversationKey]: historyMessages || [],
    }));
    setLoadingHistory(false);
  });

  // Handle message sent confirmation
  useSocket(SOCKET_EVENTS.MESSAGE_SENT, (data) => {
    console.log('Message confirmed sent:', data);
  });

  // Handle errors
  useSocket(SOCKET_EVENTS.ERROR, (data) => {
    console.error('Socket error:', data.message);
  });

  // Get current message display
  const currentMessages = selectedUser === GLOBAL_CHAT_ID
    ? globalMessages
    : selectedUser
    ? messages[[user?.username, selectedUser].sort().join('_')] || []
    : [];

  // Get the currently displayed user (for UI purposes)
  const displayedUser = selectedUser === GLOBAL_CHAT_ID ? 'Global Chat' : selectedUser;

  // Handle user/room selection
  const handleSelectUser = async (username) => {
    if (username === GLOBAL_CHAT_ID) {
      // SWITCHING TO GLOBAL CHAT
      console.log('Switching to global chat');
      
      // Leave previous 1-on-1 room if any
      if (selectedUser && selectedUser !== GLOBAL_CHAT_ID) {
        // No special cleanup needed for 1-on-1
      }

      // Join global room
      joinGlobalRoom();
      setSelectedUser(GLOBAL_CHAT_ID);

      // Fetch historical messages (only 20 most recent for performance)
      setLoadingHistory(true);
      try {
        const response = await groupChatAPI.getMessages(20, 0);
        const messages = response.data.messages || [];
        setHistoryMessages(messages);
      } catch (error) {
        console.error('Error fetching group messages:', error);
      } finally {
        setLoadingHistory(false);
      }
    } else {
      // SWITCHING TO 1-ON-1 CHAT
      console.log(`Switching to 1-on-1 chat with ${username}`);

      // Leave global room if coming from it
      if (selectedUser === GLOBAL_CHAT_ID) {
        leaveGlobalRoom();
      }

      setSelectedUser(username);
      
      // Check if we already have history in ref
      const conversationKey = [user?.username, username].sort().join('_');
      if (messagesRef.current[conversationKey]) {
        // We already have messages, display them immediately
        setMessages((prev) => ({
          ...prev,
          [conversationKey]: messagesRef.current[conversationKey],
        }));
        setLoadingHistory(false);
      } else {
        // Fetch history from REST API (will persist across refreshes)
        setLoadingHistory(true);
        try {
          // Load only 20 most recent messages for performance (sliding window)
          const response = await messageAPI.getMessagesWith(username, 20);
          console.log(`✅ Fetched messages for ${username}:`, response.data);
          
          const msgs = response.data.messages || [];
          console.log(`📨 Got ${msgs.length} messages`);
          
          // Store in ref for session persistence
          messagesRef.current[conversationKey] = msgs;
          
          // Update state
          setMessages((prev) => ({
            ...prev,
            [conversationKey]: msgs,
          }));
        } catch (error) {
          console.error(`❌ Error fetching messages with ${username}:`, error.response?.data || error.message);
        } finally {
          setLoadingHistory(false);
        }
      }
    }
  };

  // Handle message sending (CRITICAL: Different logic for global vs 1-on-1)
  const handleSendMessage = (content) => {
    if (selectedUser === GLOBAL_CHAT_ID) {
      // SEND GLOBAL MESSAGE
      // CRITICAL FAULT TOLERANCE: This will throw if server disconnected
      sendGlobalMessage(user?.username, content);
    } else {
      // SEND 1-ON-1 MESSAGE (via WebRTC DataChannel or Socket.IO)
      emit('send_message', {
        sender: user?.username,
        receiver: selectedUser,
        content,
      });

      // Optimistic UI update - MUST sync with messagesRef
      const conversationKey = [user?.username, selectedUser]
        .sort()
        .join('_');
      const newMessage = {
        sender: user?.username,
        receiver: selectedUser,
        content,
        timestamp: new Date().toISOString(),
      };
      
      // Update ref for persistence
      messagesRef.current[conversationKey] = [
        ...(messagesRef.current[conversationKey] || []),
        newMessage,
      ];
      
      // Update UI state
      setMessages((prev) => ({
        ...prev,
        [conversationKey]: messagesRef.current[conversationKey],
      }));
    }
  };

  if (loadingUsers) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-slate-900 via-primary to-primary-dark text-white px-6 py-4 flex justify-between items-center shadow-xl border-b-4 border-primary">
        <div className="flex items-center gap-3">
          <div className="text-2xl">💬</div>
          <div>
            <h1 className="text-2xl font-bold">Chat</h1>
            <p className="text-xs text-blue-100">👤 {user?.username}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-medium transition border border-white border-opacity-20 hover:border-opacity-40"
        >
          🚪 Logout
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 overflow-hidden border-r border-slate-200">
          <UserList
            users={users}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            currentUsername={user?.username}
            activeUsers={activeUsers}
          />
        </div>

        {/* Chat Window and Input */}
        <div className="flex-1 flex flex-col">
          <ChatWindow
            messages={currentMessages}
            selectedUser={displayedUser}
            currentUsername={user?.username}
            loadingHistory={loadingHistory}
            isGlobalChat={selectedUser === GLOBAL_CHAT_ID}
          />
          <MessageInput
            selectedUser={selectedUser}
            onSendMessage={handleSendMessage}
            isGlobalChat={selectedUser === GLOBAL_CHAT_ID}
          />
        </div>
      </div>
    </div>
  );
}

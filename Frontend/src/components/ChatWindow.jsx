import React, { useEffect, useRef } from 'react';
import { useGlobalChat } from '../contexts/GlobalChatContext';

export default function ChatWindow({
  messages,
  selectedUser,
  currentUsername,
  loadingHistory,
  isGlobalChat = false,
}) {
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { isConnected } = useGlobalChat();

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 0);
    }
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">💬</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Start Chatting</h2>
          <p className="text-slate-600 text-lg">
            {isGlobalChat
              ? 'Select a user or join the global chat'
              : 'Select a user from the left to begin a conversation'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
              {isGlobalChat ? '🌍' : selectedUser.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {isGlobalChat ? 'Global Chat' : selectedUser}
              </h2>
              <p className="text-xs text-slate-500">
                {isGlobalChat
                  ? isConnected
                    ? '🟢 Connected'
                    : '🔴 Disconnected - Messages via WebRTC only'
                  : 'Online'}
              </p>
            </div>
          </div>
          {/* Show disconnect warning for global chat */}
          {isGlobalChat && !isConnected && (
            <div className="flex-shrink-0 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              <span className="text-sm font-medium text-red-700">
                ⚠️ Server Disconnected
              </span>
            </div>
          )}
          <div className="flex-shrink-0 flex gap-3 ml-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition">📱</button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition">⋮</button>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0"
      >
        {loadingHistory && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center text-slate-500">
              <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
              <p className="text-sm">Loading messages...</p>
            </div>
          </div>
        )}

        {messages.length === 0 && !loadingHistory && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center text-slate-500">
              <div className="text-5xl mb-4">👋</div>
              <p className="mb-2 font-medium">No messages yet</p>
              <p className="text-sm">
                {isGlobalChat
                  ? 'Be the first to say something!'
                  : `Start a conversation with ${selectedUser}!`}
              </p>
            </div>
          </div>
        )}

        {/* Messages Grid */}
        <div className="flex flex-col gap-3 w-full">
          {messages.map((msg, idx) => {
            const isSent =
              msg.sender === currentUsername ||
              msg.sender_username === currentUsername;
            const senderName = msg.sender || msg.sender_username || 'Unknown';
            const timestamp = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={idx}
                className={`flex w-full ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isSent ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white ${isSent
                        ? 'bg-gradient-to-br from-primary to-primary-dark'
                        : 'bg-slate-400'
                      }`}
                  >
                    {isSent
                      ? currentUsername?.charAt(0).toUpperCase()
                      : senderName.charAt(0).toUpperCase()}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
                    {/* Show sender name for group chat received messages */}
                    {isGlobalChat && !isSent && (
                      <p className="text-xs font-bold text-slate-600 mb-1 px-3">
                        {senderName}
                      </p>
                    )}

                    {/* Message Content */}
                    <div
                      className={`rounded-2xl px-4 py-2 break-words shadow-md ${isSent
                          ? 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-br-none'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Timestamp */}
                    <p
                      className={`text-xs mt-1 px-2 ${isSent ? 'text-slate-500' : 'text-slate-500'
                        }`}
                    >
                      {timestamp}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

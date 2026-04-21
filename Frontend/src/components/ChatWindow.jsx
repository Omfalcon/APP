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
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div className="text-center animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-5xl mb-8 mx-auto shadow-2xl shadow-primary/5">
            ✨
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Initiate Connection</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed uppercase tracking-widest font-bold opacity-60">
            {isGlobalChat
              ? 'Join the global frequency to begin'
              : 'Secure channel ready. Select a contact to sync.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-transparent min-h-0 relative z-20">
      {/* Header - Glassmorphism */}
      <div className="flex-shrink-0 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 transition-all duration-500 ${isGlobalChat ? 'rotate-0' : 'rotate-3 group-hover:rotate-0'}`}>
              {isGlobalChat ? '🌍' : selectedUser.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate tracking-tight">
                {isGlobalChat ? 'Global Chat' : selectedUser}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isGlobalChat ? (isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500') : 'bg-green-500 animate-pulse'}`} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {isGlobalChat
                    ? isConnected
                      ? 'Frequency Active'
                      : 'Sync Interrupted'
                    : 'Encrypted Channel'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-white/5">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.6 11.6L22 7v10l-6.4-4.6z"/><rect x="2" y="5" width="14" height="14" rx="2"/></svg>
            </button>
            <button className="p-2.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-white/5">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 min-h-0 scrollbar-none"
      >
        {loadingHistory && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center text-slate-500">
              <div className="inline-block animate-spin text-2xl mb-2 text-primary">⏳</div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-50">Syncing History</p>
            </div>
          </div>
        )}

        {messages.length === 0 && !loadingHistory && (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-sm font-bold uppercase tracking-widest text-center">
              {isGlobalChat
                ? 'Be the first to speak'
                : 'No messages yet'}
            </p>
          </div>
        )}

        {/* Messages Grid */}
        <div className="flex flex-col gap-4 w-full">
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
                className={`flex w-full group animate-in fade-in slide-in-from-bottom-1 duration-300 ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${isSent ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                  {/* Avatar - Hidden on very small mobile if space is tight */}
                  {!isSent && (
                    <div className="hidden sm:flex-shrink-0 sm:w-8 sm:h-8 rounded-lg bg-white/5 border border-white/10 sm:flex items-center justify-center font-bold text-xs text-white uppercase group-hover:border-primary/50 transition-colors">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
                    {/* Show sender name for group chat received messages */}
                    {isGlobalChat && !isSent && (
                      <p className="text-[10px] font-bold text-primary-light mb-1 px-1 uppercase tracking-wider">
                        {senderName}
                      </p>
                    )}

                    {/* Message Content */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-xl transition-all duration-300 ${isSent
                          ? 'bg-gradient-to-br from-primary to-primary-dark text-white rounded-br-none hover:shadow-primary/20'
                          : 'bg-white/5 text-slate-100 border border-white/5 rounded-bl-none backdrop-blur-sm'
                        }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Timestamp */}
                    <p className="text-[9px] mt-1.5 px-1 font-bold text-slate-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
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

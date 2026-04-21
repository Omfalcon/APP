import React, { useState } from 'react';
import { useGlobalChat } from '../contexts/GlobalChatContext';

export default function MessageInput({
  selectedUser,
  onSendMessage,
  disabled = false,
  isGlobalChat = false,
}) {
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const { isConnected } = useGlobalChat();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!messageText.trim()) {
      return;
    }

    try {
      onSendMessage(messageText);
      setMessageText('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
      console.error('Message send error:', err);
    }
  };

  // CRITICAL: Disable input if server disconnected for global chat
  const isDisabled = !selectedUser || (isGlobalChat && !isConnected) || disabled;
  const disableReason =
    isGlobalChat && !isConnected
      ? 'Server disconnected. Try again when connection is restored.'
      : !selectedUser
        ? 'Select a user or global chat first'
        : '';

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl border-t border-white/5 px-4 md:px-8 py-4 md:py-6 relative z-50">
      {error && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-xl animate-in fade-in slide-in-from-top-2">
          ⚠️ {error}
        </div>
      )}

      {isDisabled && disableReason && (
        <div className="mb-3 p-3 bg-primary/10 border border-primary/20 text-primary-light text-[10px] font-bold uppercase tracking-widest rounded-xl">
          ℹ️ {disableReason}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 md:gap-4 items-center">
        <button
          type="button"
          disabled={isDisabled}
          className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-white transition-colors"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </button>

        <div className="flex-1 relative group">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={isDisabled ? disableReason : 'Type a message...'}
            disabled={isDisabled}
            className="w-full px-5 py-3 md:py-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled || !messageText.trim()}
          className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </form>
    </div>
  );
}

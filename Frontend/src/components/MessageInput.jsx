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
    <div className="bg-white border-t border-slate-200 px-6 py-4 shadow-lg">
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {isDisabled && disableReason && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg">
          ℹ️ {disableReason}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <button
          type="button"
          disabled={isDisabled}
          className="p-2 hover:bg-slate-100 rounded-lg transition text-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ➕
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={isDisabled ? disableReason : 'Type a message...'}
            disabled={isDisabled}
            className="w-full px-4 py-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition bg-slate-50"
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled || !messageText.trim()}
          className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white font-semibold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform duration-200 active:scale-95"
        >
          📤
        </button>
      </form>
    </div>
  );
}

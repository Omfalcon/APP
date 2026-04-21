import React, { useState, useMemo } from 'react';

export default function UserList({ users, selectedUser, onSelectUser, currentUsername, activeUsers = [] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        user.username !== currentUsername
    );
  }, [users, searchQuery, currentUsername]);

  const isUserOnline = (username) => activeUsers.includes(username);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header Area */}
      <div className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Contacts</h2>
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs">
            {filteredUsers.length}
          </div>
        </div>

        {/* 🌍 Global Chat Button */}
        <button
          onClick={() => onSelectUser('__GLOBAL_CHAT__')}
          className={`w-full p-4 text-left rounded-2xl transition-all duration-300 font-bold mb-6 flex items-center gap-4 group ${selectedUser === '__GLOBAL_CHAT__'
              ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl shadow-primary/20 scale-[1.02]'
              : 'bg-white/5 hover:bg-white/10 text-slate-100 border border-white/5'
            }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${selectedUser === '__GLOBAL_CHAT__' ? 'bg-white/20' : 'bg-primary/20'}`}>
            🌍
          </div>
          <div className="flex flex-col">
            <span className="text-sm tracking-tight text-white">Global Assembly</span>
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Public Channel</span>
          </div>
        </button>

        {/* Search Bar */}
        <div className="relative group">
          <input
            type="text"
            placeholder="Search Contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-none">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const online = isUserOnline(user.username);
            const isSelected = selectedUser === user.username;

            return (
              <button
                key={user.username}
                onClick={() => onSelectUser(user.username)}
                className={`w-full p-4 text-left rounded-2xl transition-all duration-300 group relative ${isSelected
                    ? 'bg-gradient-to-br from-primary/20 to-primary-dark/20 border border-primary/30 shadow-lg shadow-primary/5 scale-[1.02]'
                    : 'hover:bg-white/5 text-slate-300'
                  }`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar Widget */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm tracking-tighter transition-all duration-500 ${isSelected
                        ? 'bg-gradient-to-br from-primary to-primary-dark text-white rotate-3 shadow-lg shadow-primary/30'
                        : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                      }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Pulsing Status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-slate-900 transition-colors ${online ? 'bg-green-500' : 'bg-slate-700'}`}>
                      {online && <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />}
                    </div>
                  </div>

                  {/* User Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-bold text-base tracking-tight truncate ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                        {user.username}
                      </p>
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {online ? 'Active Now' : 'Last Seen Long Ago'}
                    </p>
                  </div>

                  {/* Aesthetic Arrow */}
                  {isSelected && (
                    <div className="hidden sm:block text-primary">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-20 flex flex-col items-center justify-center opacity-30">
            <div className="text-6xl mb-6">🛰️</div>
            <p className="text-xs font-bold uppercase tracking-widest text-center">
              {searchQuery ? 'Zero Signal Matches' : 'No Contacts Available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

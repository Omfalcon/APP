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
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">💬</span>
          Messages
        </h2>

        {/* 🌍 Global Chat Button (NEW) */}
        <button
          onClick={() => onSelectUser('__GLOBAL_CHAT__')}
          className={`w-full px-4 py-3 text-left rounded-lg transition duration-200 font-bold mb-3 flex items-center gap-3 ${
            selectedUser === '__GLOBAL_CHAT__'
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
              : 'hover:bg-slate-700 text-slate-100 bg-slate-700 bg-opacity-50'
          }`}
        >
          <span className="text-xl">🌍</span>
          <span>Global Chat</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-full text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
          <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredUsers.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredUsers.map((user) => {
              const online = isUserOnline(user.username);
              const isSelected = selectedUser === user.username;
              
              return (
                <button
                  key={user.username}
                  onClick={() => onSelectUser(user.username)}
                  className={`w-full px-4 py-3 text-left rounded-lg transition duration-200 group ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
                      : 'hover:bg-slate-700 text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isSelected 
                          ? 'bg-white bg-opacity-20' 
                          : 'bg-slate-600 group-hover:bg-slate-500'
                      }`}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                          {user.username}
                        </p>
                        <p className={`text-xs truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {online ? '🟢 Online' : '⚫ Offline'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Online Indicator */}
                    <div className={`w-3 h-3 rounded-full ${online ? 'bg-green-500' : 'bg-slate-600'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'No users found' : 'No users available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await signup(username, password);
      }

      navigate('/chat');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary to-primary-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-dark rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-slide-in">
          <div className="text-6xl mb-4">💬</div>
          <h1 className="text-4xl font-bold text-white mb-2">Chat App</h1>
          <p className="text-blue-100 text-sm">Connect with your cohort in real-time</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-in backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-3 font-bold rounded-lg transition ${
                isLogin
                  ? 'bg-white text-primary shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔓 Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-3 font-bold rounded-lg transition ${
                !isLogin
                  ? 'bg-white text-primary shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✨ Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm font-medium animate-slide-in flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-slate-900 mb-2">
                👤 Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose your username"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition bg-slate-50 hover:bg-white"
                disabled={loading}
                required
              />
              <p className="text-xs text-slate-500 mt-1">At least 3 characters</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-900 mb-2">
                🔐 Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition bg-slate-50 hover:bg-white"
                disabled={loading}
                required
              />
              <p className="text-xs text-slate-500 mt-1">At least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-lg font-bold hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Loading...
                </span>
              ) : isLogin ? (
                '🚀 Login'
              ) : (
                '✨ Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-600">or</span>
            </div>
          </div>

          {/* Demo Info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-sm text-slate-700">
            <p className="font-bold mb-2">💡 Demo Accounts:</p>
            <p>alice / password123</p>
            <p>bob / password456</p>
          </div>

          {/* Toggle Info */}
          <p className="text-center text-slate-600 mt-6 text-sm">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-bold text-primary hover:text-primary-dark hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-white text-xs mt-6 opacity-75">
          🔒 Your conversations are secure and private
        </p>
      </div>
    </div>
  );
}

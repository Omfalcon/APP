import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { initializeSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUser({ username: savedUsername });
      initializeSocket(savedToken);
    }

    setLoading(false);
  }, []);

  const signup = async (username, password) => {
    try {
      setError(null);
      const response = await authAPI.signup(username, password);
      const { token, username: responseUsername } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('username', responseUsername);

      setToken(token);
      setUser({ username: responseUsername });

      initializeSocket(token);

      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Signup failed';
      setError(message);
      throw new Error(message);
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await authAPI.login(username, password);
      const { token, username: responseUsername } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('username', responseUsername);

      setToken(token);
      setUser({ username: responseUsername });

      initializeSocket(token);

      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    disconnectSocket();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

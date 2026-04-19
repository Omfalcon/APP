import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (username, password) =>
    api.post(API_ENDPOINTS.AUTH.SIGNUP, { username, password }),

  login: (username, password) =>
    api.post(API_ENDPOINTS.AUTH.LOGIN, { username, password }),

  getUsers: () =>
    api.get(API_ENDPOINTS.AUTH.USERS),

  getCurrentUser: () =>
    api.get(API_ENDPOINTS.AUTH.ME),
};

export const groupChatAPI = {
  /**
   * Fetch group chat message history
   * @param {number} limit - Maximum number of messages to retrieve (default 50, max 100)
   * @param {number} skip - Number of messages to skip for pagination (default 0)
   * @returns {Promise} Messages array with sender, content, and timestamp
   */
  getMessages: (limit = 50, skip = 0) =>
    api.get(API_ENDPOINTS.AUTH.GROUP_MESSAGES, {
      params: { limit, skip },
    }),
};

export const messageAPI = {
  /**
   * Fetch 1-on-1 message history with another user (sliding window pagination)
   * @param {string} username - Username of the other user in conversation
   * @param {number} limit - Maximum number of messages to retrieve (default 20, max 50 for performance)
   * @returns {Promise} Messages array with sender, content, and timestamp
   */
  getMessagesWith: (username, limit = 20) =>
    api.get(`/api/auth/messages/${username}`, {
      params: { limit: Math.min(limit, 50) }, // Cap at 50 for performance
    }),
};

export default api;

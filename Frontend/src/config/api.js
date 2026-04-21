/**
 * Centralized API configuration for the Vocal-Chat application.
 * Automatically detects environment based on hostname.
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Base URLs
export const API_BASE = isLocalhost 
  ? 'http://localhost:5000' 
  : 'https://your-backend-url.com'; // Change this for deployment

export const SOCKET_URL = isLocalhost 
  ? 'http://localhost:5000' 
  : 'https://your-backend-url.com'; // Change this for deployment

/**
 * Helper to construct a full API URL
 * @param {string} path - The endpoint path (e.g. '/api/auth/login')
 * @returns {string} - Full URL
 */
export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

/**
 * Helper to get the Socket.IO connection URL
 * @returns {string}
 */
export const getSocketUrl = () => SOCKET_URL;

const apiConfig = {
  API_BASE,
  SOCKET_URL,
  getApiUrl,
  getSocketUrl
};

export default apiConfig;

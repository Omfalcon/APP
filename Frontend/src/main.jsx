import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalChatProvider } from './contexts/GlobalChatContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <GlobalChatProvider>
        <App />
      </GlobalChatProvider>
    </AuthProvider>
  </React.StrictMode>
);

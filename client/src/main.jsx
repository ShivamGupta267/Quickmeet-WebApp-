// src/main.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router here
import App from './App';
import { AuthProvider } from './contexts/authContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router> {/* Router now wraps everything */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
// src/react-app/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App'; // Corrected path
import './index.css';
import { AuthProvider } from './contexts/AuthContext'; // Corrected path
import { POSProvider } from './contexts/POSContext'; // Corrected path

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <POSProvider>
          <App />
        </POSProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

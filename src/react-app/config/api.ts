// API Configuration for frontend
// This file determines which backend URL to use

const getApiUrl = (): string => {
  // In production (deployed on Render), use the environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // ⚡ FIX: In development, explicitly point to the backend port (3000).
  // This bypasses the potentially misconfigured or failing Vite proxy.
  if (import.meta.env.DEV) {
    // Ensure this port (3000) matches the port your Node.js/Express server is running on.
    return 'http://localhost:3000'; 
  }
  
  // Fallback (e.g., if neither DEV nor PROD vars are set)
  return 'http://localhost:3000';
};

export const API_URL = getApiUrl();

// Helper function for making API calls
export const apiClient = {
  get: async (endpoint: string, options?: RequestInit) => {
    // API_URL is now a full URL (http://localhost:3000), so the resulting path is correct:
    // http://localhost:3000/api/performance
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return response;
  },

  post: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
    });
    return response;
  },

  put: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
    });
    return response;
  },

  delete: async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return response;
  },
};

console.log('🔌 API Configuration:', {
  mode: import.meta.env.MODE,
  apiUrl: API_URL || 'Using Proxy',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
});
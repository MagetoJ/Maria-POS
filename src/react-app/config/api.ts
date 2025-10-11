// API Configuration for frontend
// This file determines which backend URL to use

const getApiUrl = (): string => {
  // In production (deployed on Render), use the environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use proxy (which forwards /api to localhost:3001)
  if (import.meta.env.DEV) {
    return ''; // Empty string uses the proxy defined in vite.config.ts
  }
  
  // Fallback
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();

// Helper function for making API calls
export const apiClient = {
  get: async (endpoint: string, options?: RequestInit) => {
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
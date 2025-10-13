// API Configuration for frontend
// This file determines which backend URL to use

const getApiUrl = (): string => {
  // 1. Explicit VITE_API_URL (e.g., in staging or when using a different domain)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Development mode (using localhost for local server)
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'; 
  }
  
  // 3. Production Fallback (Use relative path to connect to the same host/origin)
  // This correctly resolves to https://pos.mariahavens.com
  return ''; // Empty string means the API calls are relative (e.g., /api/login)
};

export const API_URL = getApiUrl(); 

// Helper function for making API calls
export const apiClient = {
  get: async (endpoint: string, options?: RequestInit) => {
    // API_URL is now a full URL (http://localhost:3000), so the resulting path is correct:
    // /api/performance
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
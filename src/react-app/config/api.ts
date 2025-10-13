// API Configuration for frontend
// This file determines which backend URL to use

const getApiUrl = (): string => {
  // 1. Explicit VITE_API_URL (preferred method for all deployments)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Production fallback URLs based on hostname
  if (import.meta.env.PROD) {
    const hostname = window.location.hostname;
    
    console.log('🔍 Production mode detected:', {
      hostname,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    });
    
    // Check for known production domains
    if (hostname.includes('mariahavens.com')) {
      return 'https://maria-pos-podv.onrender.com';
    }
    
    // When deployed on the same Render service (fullstack deployment)
    if (hostname.includes('onrender.com')) {
      // Check if we're on the backend URL itself
      if (hostname === 'maria-pos-podv.onrender.com') {
        return ''; // Use relative paths when frontend is served by backend
      }
      // If on a different onrender domain, point to backend
      return 'https://maria-pos-podv.onrender.com';
    }
    
    // Default production backend - ALWAYS use full URL in production
    return 'https://maria-pos-podv.onrender.com';
  }
  
  // 3. Development mode (using localhost for local server)
  return 'http://localhost:3000'; 
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
  finalApiUrl: API_URL,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
});
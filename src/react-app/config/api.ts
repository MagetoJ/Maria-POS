// src/config/api.ts
// Environment-aware API Configuration
import { ENV, IS_DEVELOPMENT, IS_PRODUCTION, envLog } from './environment';

// Re-export for backward compatibility
export { IS_DEVELOPMENT, IS_PRODUCTION, ENV };

const getApiUrl = (): string => {
  // 1. Explicit VITE_API_URL always takes precedence
  if (import.meta.env.VITE_API_URL) {
    envLog.dev('🔧 Using explicit VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Production environment
  if (ENV.isProduction) {
    // When frontend is served by backend (same domain)
    if (ENV.hostname.includes('onrender.com') || ENV.hostname.includes('mariahavens.com')) {
      envLog.dev('🔧 Using relative paths for same-domain deployment');
      return ''; // Use relative paths - backend serves frontend
    }
    
    // Default production backend URL
    envLog.dev('🔧 Using default production URL');
    return 'https://pos.mariahavens.com';
  }
  
  // 3. Development environment
  envLog.dev('🔧 Using localhost for development');
  return 'http://localhost:3000';
};

export const API_URL = getApiUrl();

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('pos_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    envLog.dev('🔑 Auth header added:', headers['Authorization'].substring(0, 30) + '...');
  } else {
    envLog.warn('⚠️ No token found in localStorage');
  }
  
  return headers;
};

// API Client with environment-aware logging
const DEFAULT_TIMEOUT = 10000; // 10 seconds

export const apiClient = {
  get: async (endpoint: string, options?: RequestInit) => {
    envLog.dev('📡 GET Request to:', `${API_URL}${endpoint}`);
    
    const headers = getAuthHeaders();
    
    // Merge options with default timeout if no signal is provided
    const mergedOptions = {
      ...options,
      signal: options?.signal || AbortSignal.timeout(DEFAULT_TIMEOUT)
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      ...mergedOptions,
      headers: {
        ...headers,
        ...options?.headers,
      },
      credentials: 'include',
    });
    
    envLog.dev('📥 Response status:', response.status);
    if (!response.ok && IS_DEVELOPMENT) {
      const errorText = await response.clone().text();
      envLog.error('❌ Error response:', errorText);
    }
    
    return response;
  },

  post: async (endpoint: string, data?: any, options?: RequestInit) => {
    envLog.dev('📡 POST Request to:', `${API_URL}${endpoint}`);
    
    const headers = getAuthHeaders();
    
    // Merge options with default timeout if no signal is provided
    const mergedOptions = {
      ...options,
      signal: options?.signal || AbortSignal.timeout(DEFAULT_TIMEOUT)
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      ...mergedOptions,
      headers: {
        ...headers,
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });
    
    envLog.dev('📥 Response status:', response.status);
    
    return response;
  },

  put: async (endpoint: string, data?: any, options?: RequestInit) => {
    envLog.dev('📡 PUT Request to:', `${API_URL}${endpoint}`);
    
    const headers = getAuthHeaders();
    
    // Merge options with default timeout if no signal is provided
    const mergedOptions = {
      ...options,
      signal: options?.signal || AbortSignal.timeout(DEFAULT_TIMEOUT)
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      ...mergedOptions,
      headers: {
        ...headers,
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });
    
    envLog.dev('📥 Response status:', response.status);
    
    return response;
  },

  delete: async (endpoint: string, options?: RequestInit) => {
    envLog.dev('📡 DELETE Request to:', `${API_URL}${endpoint}`);
    
    const headers = getAuthHeaders();
    
    // Merge options with default timeout if no signal is provided
    const mergedOptions = {
      ...options,
      signal: options?.signal || AbortSignal.timeout(DEFAULT_TIMEOUT)
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      ...mergedOptions,
      headers: {
        ...headers,
        ...options?.headers,
      },
      credentials: 'include',
    });
    
    envLog.dev('📥 Response status:', response.status);
    
    return response;
  },

  patch: async (endpoint: string, data?: any, options?: RequestInit) => {
    envLog.dev('📡 PATCH Request to:', `${API_URL}${endpoint}`);

    const headers = getAuthHeaders();

    // Merge options with default timeout if no signal is provided
    const mergedOptions = {
      ...options,
      signal: options?.signal || AbortSignal.timeout(DEFAULT_TIMEOUT)
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      ...mergedOptions,
      headers: {
        ...headers,
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    envLog.dev('📥 Response status:', response.status);

    return response;
  },
};

// Enhanced environment logging in development (only for debugging)
if (IS_DEVELOPMENT && import.meta.env.VITE_DEBUG_API === 'true') {
  console.group('🔌 API Configuration');
  console.log('Environment:', ENV);
  console.log('API URL:', API_URL || 'Using relative paths');
  console.log('Auth Token Present:', !!localStorage.getItem('pos_token'));
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.groupEnd();
}

// --- ADD THIS NEW FUNCTION ---
/**
 * Fetches completed orders with items and payments for admin receipt auditing.
 */
export const fetchReceiptsByDate = async (
  startDate: string, 
  endDate: string, 
  limit: number, 
  offset: number,
  orderType?: string,
  customerName?: string
) => {
  // Construct the endpoint with query parameters
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    limit: limit.toString(),
    offset: offset.toString()
  });
  
  if (orderType) {
    params.append('order_type', orderType);
  }
  
  if (customerName) {
    params.append('customer_name', customerName);
  }
  
  const endpoint = `/api/reports/receipts?${params.toString()}`;
  
  // Use the correct 'apiClient'
  const response = await apiClient.get(endpoint);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch receipts');
  }
  return response.json(); // Return the JSON data
};
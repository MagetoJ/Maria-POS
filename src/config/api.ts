export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getApiUrl = (endpoint: string) => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

export const getWebSocketUrl = () => {
  const baseUrl = API_BASE_URL.replace('http', 'ws');
  return `${baseUrl}/ws/kitchen`;
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';

export interface User {
  id: number;
  employee_id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen_staff' | 'delivery' | 'receptionist' | 'housekeeping';
  pin?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // ⚡ FIX 1: Add token to the context interface
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  validateStaffPin: (username: string, pin: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('pos_user');
    const storedToken = localStorage.getItem('pos_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setIsInitialLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      console.log('🔌 Attempting login to:', `${API_URL}/api/login`);
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        // Add timeout and mobile-specific options
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        
        if (response.status === 401) {
          return { success: false, message: 'Invalid username or password' };
        } else if (response.status === 500) {
          return { success: false, message: 'Server is temporarily unavailable' };
        } else if (response.status >= 400) {
          return { success: false, message: errorData.message || 'Login failed' };
        }
        
        return { success: false, message: errorData.message || 'Invalid credentials' };
      }

      const { user: foundUser, token: newToken } = await response.json();
      
      if (!foundUser || !newToken) {
        return { success: false, message: 'Invalid server response' };
      }
      
      setUser(foundUser);
      setToken(newToken);
      localStorage.setItem('pos_user', JSON.stringify(foundUser));
      localStorage.setItem('pos_token', newToken);

      console.log('✅ Login successful for user:', foundUser.username, 'Role:', foundUser.role);

      switch (foundUser.role) {
        case 'admin':
        case 'manager':
          navigate('/admin');
          break;
        case 'housekeeping':
          navigate('/housekeeping');
          break;
        default:
          navigate('/pos');
          break;
      }

      return { success: true };

    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      if (error.name === 'AbortError') {
        return { success: false, message: 'Login request timed out. Please try again.' };
      }
      
      if (error.message?.includes('fetch')) {
        return { success: false, message: 'Cannot connect to server. Please check your internet connection.' };
      }
      
      return { success: false, message: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const validateStaffPin = async (username: string, pin: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/api/validate-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin })
      });

      if (response.ok) {
        const userData: User = await response.json();
        return userData;
      } else {
        return null; 
      }
    } catch (error) {
      console.error('PIN validation error:', error);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_token');
    navigate('/login', { replace: true });
  };
  
  const value = {
    user,
    token, // ⚡ FIX 2: Expose the token state
    login,
    logout,
    isLoading,
    validateStaffPin,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isInitialLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
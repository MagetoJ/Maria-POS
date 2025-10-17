import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';

const IS_DEVELOPMENT = import.meta.env.DEV;

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
  token: string | null;
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
      
      if (IS_DEVELOPMENT) {
        console.log('✅ Restored session for:', JSON.parse(storedUser).username);
      }
    }
    setIsInitialLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      if (IS_DEVELOPMENT) {
        console.log('🔐 Attempting login for:', username);
      }
      
      const response = await apiClient.post('/api/login', { username, password }, {
        signal: AbortSignal.timeout(15000)
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

      if (IS_DEVELOPMENT) {
        console.log('✅ Login successful for user:', foundUser.username, 'Role:', foundUser.role);
        console.log('🔑 Token saved (first 30 chars):', newToken.substring(0, 30) + '...');
      }

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
          case 'receptionist': // <-- ADD THIS CASE
          navigate('/reception');
          break;
          case 'kitchen_staff': // <-- ADD THIS CASE
          navigate('/kitchen');
          break;
      }

      return { success: true };

    } catch (error: any) {
      if (IS_DEVELOPMENT) {
        console.error('❌ Login error:', error);
      }
      
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
      const response = await apiClient.post('/api/validate-pin', { username, pin });

      if (response.ok) {
        const userData: User = await response.json();
        return userData;
      } else {
        return null; 
      }
    } catch (error) {
      if (IS_DEVELOPMENT) {
        console.error('PIN validation error:', error);
      }
      return null;
    }
  };

  const logout = () => {
    if (IS_DEVELOPMENT) {
      console.log('👋 Logging out user:', user?.username);
    }
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_token');
    navigate('/login', { replace: true });
  };
  
  const value = {
    user,
    token,
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
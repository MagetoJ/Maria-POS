import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';

const IS_DEVELOPMENT = import.meta.env.DEV;

export interface User {
  id: number;
  employee_id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen_staff' | 'delivery' | 'receptionist' | 'housekeeping' | 'accountant';
  pin?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
  isCleared: boolean;
  loadingClearance: boolean;
  isAuthenticated: boolean;
  validateStaffPin: (username: string, pin: string) => Promise<{ user: User, token: string } | null>;
  verifyClearanceStatus: (userId: number, manualToken?: string) => Promise<void>;
  checkClearanceStatus: (userId: number, manualToken?: string) => Promise<{ clearedToday: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleared, setIsCleared] = useState(true);
  const [loadingClearance, setLoadingClearance] = useState(false);
  const navigate = useNavigate();

  const checkClearanceStatus = async (userId: number, manualToken?: string) => {
    const now = new Date();
    // If it's between 12:00 AM and 8:00 AM, we allow them to finish the "night shift"
    if (now.getHours() < 8) {
      return { clearedToday: true, message: 'Within grace period' };
    }

    try {
      const options: RequestInit = manualToken ? {
        headers: {
          'Authorization': `Bearer ${manualToken}`
        }
      } : {};

      // Add a 5-second timeout to clearance check to prevent long hangs
      const response = await apiClient.get(`/api/staff/check-clearance/${userId}`, {
        ...options,
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        return await response.json();
      }
      return { clearedToday: false, message: 'Failed to verify clearance' };
    } catch (error) {
      console.error("Clearance check error:", error);
      return { clearedToday: true, message: 'Connection error - assuming cleared' }; // Optimistic fallback
    }
  };

  const verifyClearanceStatus = async (userId: number, manualToken?: string) => {
    setLoadingClearance(true);
    const result = await checkClearanceStatus(userId, manualToken);
    setIsCleared(result.clearedToday);
    setLoadingClearance(false);
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('pos_user');
      const storedToken = localStorage.getItem('pos_token');
      
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
          setToken(storedToken);
          
          if (IS_DEVELOPMENT) {
            console.log('✅ Restored session for:', parsedUser.username);
          }
          
          // Verify clearance when restoring session
          verifyClearanceStatus(parsedUser.id, storedToken);
        } else {
          // Clear invalid data
          localStorage.removeItem('pos_user');
          localStorage.removeItem('pos_token');
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('pos_user');
      localStorage.removeItem('pos_token');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      if (IS_DEVELOPMENT) {
        console.log('🔐 Attempting login for:', username);
      }
      
      const response = await apiClient.post('/api/auth/login', { username, password }, {
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

      // Verify clearance status upon login - DO NOT AWAIT, 
      // let the individual dashboard components handle this if needed
      verifyClearanceStatus(foundUser.id, newToken);

      if (IS_DEVELOPMENT) {
        console.log('✅ Login successful for user:', foundUser.username, 'Role:', foundUser.role);
        console.log('🔑 Token saved (first 30 chars):', newToken.substring(0, 30) + '...');
      }

      switch (foundUser.role) {
        case 'admin':
        case 'manager':
          navigate('/admin');
          break;
        case 'accountant':
          navigate('/accountant');
          break;
        case 'housekeeping':
          navigate('/housekeeping');
          break;
        case 'receptionist':
          navigate('/reception');
          break;
        case 'kitchen_staff':
          navigate('/kitchen');
          break;
        default:
          navigate('/pos');
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

  const validateStaffPin = async (username: string, pin: string): Promise<{ user: User, token: string } | null> => {
    try {
      const response = await apiClient.post('/api/auth/validate-pin', { username, pin });

      if (response.ok) {
        const data = await response.json();
        return { user: data.user, token: data.token };
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

  const logout = async () => {
    if (IS_DEVELOPMENT) {
      console.log('👋 Logging out user:', user?.username);
    }
    
    // Call server logout endpoint to mark session as inactive
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      if (IS_DEVELOPMENT) {
        console.error('Server logout error:', error);
      }
      // Continue with local logout even if server call fails
    }
    
    setUser(null);
    setToken(null);
    setIsCleared(true); // Reset to default true for next user
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
    isCleared,
    loadingClearance,
    validateStaffPin,
    verifyClearanceStatus,
    checkClearanceStatus,
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
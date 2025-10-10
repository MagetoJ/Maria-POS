import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

export interface User {
  id: number;
  employee_id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen_staff' | 'delivery' | 'receptionist' | 'housekeeping';
  pin: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
  validateStaffPin: (employeeId: string, pin: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('pos_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login to:', getApiUrl('/api/login'));
      
      const response = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData.message);
        return { success: false, message: errorData.message || 'Invalid credentials' };
      }

      const { user: foundUser, token } = await response.json();
      console.log('Login successful:', foundUser.username);
      
      setUser(foundUser);
      localStorage.setItem('pos_user', JSON.stringify(foundUser));
      localStorage.setItem('pos_token', token);
      return { success: true };

    } catch (error) {
      console.error('Login API call failed:', error);
      return { success: false, message: 'Could not connect to the server. Make sure the backend is running on port 3001.' };
    } finally {
      setIsLoading(false);
    }
  };

  const validateStaffPin = async (employeeId: string, pin: string): Promise<User | null> => {
    try {
      const response = await fetch(getApiUrl('/api/validate-pin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, pin }),
      });

      if (!response.ok) {
        return null;
      }

      const foundUser = await response.json();
      return foundUser;
    } catch (error) {
      console.error('Validate PIN API call failed:', error);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, validateStaffPin }}>
      {!isLoading && children}
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
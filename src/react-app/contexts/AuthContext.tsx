import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  employee_id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen_staff' | 'delivery' | 'receptionist' | 'housekeeping';
  pin: string;
  password: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  validateStaffPin: (employeeId: string, pin: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data
const mockUsers: User[] = [
  { id: 1, employee_id: 'EMP001', username: 'john.manager', name: 'John Manager', role: 'manager', pin: '1234', password: 'manager123', is_active: true },
  { id: 2, employee_id: 'EMP002', username: 'mary.waiter', name: 'Mary Waiter', role: 'waiter', pin: '5678', password: 'waiter123', is_active: true },
  { id: 3, employee_id: 'EMP003', username: 'james.cashier', name: 'James Cashier', role: 'cashier', pin: '9999', password: 'cashier123', is_active: true },
  { id: 4, employee_id: 'EMP004', username: 'sarah.chef', name: 'Sarah Chef', role: 'kitchen_staff', pin: '1111', password: 'chef123', is_active: true },
  { id: 5, employee_id: 'EMP005', username: 'admin', name: 'Admin User', role: 'admin', pin: '0000', password: 'admin123', is_active: true },
  { id: 6, employee_id: 'EMP006', username: 'rose.reception', name: 'Rose Receptionist', role: 'receptionist', pin: '2222', password: 'reception123', is_active: true },
  { id: 7, employee_id: 'EMP007', username: 'peter.delivery', name: 'Peter Delivery', role: 'delivery', pin: '3333', password: 'delivery123', is_active: true },
  { id: 8, employee_id: 'EMP008', username: 'grace.housekeeping', name: 'Grace Housekeeping', role: 'housekeeping', pin: '4444', password: 'housekeeping123', is_active: true },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('pos_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(
      u => u.username === username && u.password === password && u.is_active
    );
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('pos_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const validateStaffPin = async (employeeId: string, pin: string): Promise<User | null> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = mockUsers.find(
      u => u.employee_id === employeeId && u.pin === pin && u.is_active
    );
    
    return foundUser || null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pos_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, validateStaffPin }}>
      {children}
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

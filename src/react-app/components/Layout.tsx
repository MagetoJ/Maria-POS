import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  LogOut, 
  Store, 
  Settings, 
  FileText, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Coffee,
  Bed,
  UtensilsCrossed,
  BarChart3
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'manager', 'staff', 'waiter', 'cashier'] },
    { path: '/admin', label: 'Admin', icon: LayoutDashboard, roles: ['admin', 'manager'] },
    { path: '/kitchen', label: 'Kitchen', icon: UtensilsCrossed, roles: ['kitchen_staff', 'admin', 'manager'] },
    { path: '/reception', label: 'Reception', icon: Bed, roles: ['receptionist', 'admin', 'manager'] },
    { path: '/housekeeping', label: 'Housekeeping', icon: Coffee, roles: ['housekeeping', 'admin', 'manager'] },
    { path: '/accountant', label: 'Accounts', icon: BarChart3, roles: ['accountant', 'admin', 'manager'] },
  ].filter(item => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside 
          className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="p-4 flex justify-end border-b border-gray-100">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-yellow-100 text-yellow-900 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 font-medium'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-yellow-700' : 'text-gray-400'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center gap-2 text-yellow-600">
              <Store className="w-6 h-6" />
              <span className="font-bold text-gray-900">Menu</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-yellow-100 text-yellow-900 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-700' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Bar (optional, based on SmartBiz style) */}
      <div className="lg:hidden h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 shrink-0">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-yellow-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

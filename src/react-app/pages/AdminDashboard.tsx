import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../config/api';
import { envLog, IS_DEVELOPMENT } from '../config/environment';
import Header from '../components/Header';
import StaffManagement from '../components/admin/StaffManagement';
import InventoryManagement from '../components/admin/InventoryManagement';
import MenuManagement from '../components/admin/MenuManagement';
import RoomManagement from '../components/admin/RoomManagement';
import ReportsManagement from '../components/admin/ReportsManagement';
import SettingsManagement from '../components/admin/SettingsManagement';
import ShiftManagement from '../components/admin/ShiftManagement';
import PerformanceDashboard from '../components/PerfomanceDashboardView';
import PersonalSalesReport from '../components/PersonalSalesReport';
import SearchComponent from '../components/SearchComponent';
import { navigateToSearchResult } from '../utils/searchNavigation';

import {
  BarChart3,
  Users,
  Package,
  Settings,
  FileText,
  UtensilsCrossed,
  Bed,
  AlertTriangle,
  DollarSign,
  Loader2,
  Clock, 
  TrendingUp,
  Search,
} from 'lucide-react';

// --- Helper Functions ---

// This function formats numbers as currency.
export const formatCurrency = (amount: number | string) => {
  // Parse amount to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (typeof numAmount !== 'number' || isNaN(numAmount)) {
    return 'KES 0';
  }
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(numAmount);
};

// This function calculates how long ago a date was.
export const timeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

// Interface for the fetched overview data
interface OverviewStats {
    todaysRevenue: number;
    ordersToday: number;
    activeStaff: number;
    lowStockItems: number;
    recentOrders: {
        id: number;
        order_number: string;
        location: string;
        total_amount: number;
        created_at: string;
    }[];
}

interface ActiveUser {
  is_active: any;
  [x: string]: any;
  staff_id: any;
  is_active: any;
  logout_time: string;
  id: number;
  name: string;
  role: string;
  login_time: string;
}

interface LowStockItem {
  id: number;
  name: string;
  current_stock: number;
  minimum_stock: number;
  inventory_type: string;
  unit: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  // Handle navigation from URL hash (for search result navigation)
  useEffect(() => {
    if (location.hash) {
      const tab = location.hash.substring(1); // Remove the # symbol
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
    }
  }, [location.hash]);

  // Clear hash after navigation to prevent issues with back button
  useEffect(() => {
    if (location.hash && activeTab !== 'overview') {
      // Clear the hash after a short delay
      setTimeout(() => {
        window.history.replaceState(null, '', '/admin');
      }, 100);
    }
  }, [activeTab, location.hash]);

  const fetchActiveUsers = async () => {
    try {
      envLog.dev('👥 Fetching user sessions...');
      const response = await apiClient.get('/api/admin/user-sessions');
      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data);
        envLog.dev('✅ User sessions loaded:', data);
      }
    } catch (error) {
      envLog.error('❌ Error fetching user sessions:', error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      envLog.dev('📦 Fetching low stock items...');
      const response = await apiClient.get('/api/admin/low-stock-alerts');
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data);
        envLog.dev('✅ Low stock items loaded:', data);
      }
    } catch (error) {
      envLog.error('❌ Error fetching low stock items:', error);
    }
  };

  useEffect(() => {
      const fetchOverviewData = async () => {
          if (activeTab === 'overview') {
              setIsLoading(true);
              setError(null);
              
              try {
                  envLog.dev('📊 Fetching overview stats...');
                  
                  // Use apiClient which automatically adds auth headers
                  const response = await apiClient.get('/api/dashboard/overview-stats');
                  
                  if (!response.ok) {
                      const errorText = await response.text();
                      envLog.error('❌ API Error:', response.status, errorText);
                      
                      throw new Error(`Failed to fetch overview stats. Status: ${response.status}`);
                  }
                  
                  const data = await response.json();
                  envLog.dev('✅ Overview stats loaded:', data);
                  
                  setOverviewData(data);

                  // Also fetch active users and low stock items for the overview
                  await Promise.all([
                    fetchActiveUsers(),
                    fetchLowStockItems()
                  ]);
              } catch (error: any) {
                  if (IS_DEVELOPMENT) {
                      console.error("❌ Error fetching overview stats:", error);
                  }
                  
                  // Provide more specific error messages
                  if (error.message?.includes('403')) {
                      setError("Access denied. Please log in again.");
                  } else if (error.message?.includes('401')) {
                      setError("Authentication required. Please log in.");
                  } else if (error.message?.includes('fetch')) {
                      setError("Cannot connect to server. Please check your connection.");
                  } else {
                      setError("Could not load dashboard data. Please try again later.");
                  }
              } finally {
                  setIsLoading(false);
              }
          }
      };

      fetchOverviewData();
  }, [activeTab]);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'search', label: 'Global Search', icon: Search },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'shifts', label: 'Shift Management', icon: Clock },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'rooms', label: 'Room Management', icon: Bed },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'sales-reports', label: 'Sales Reports', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderOverview = () => {
      if (isLoading) {
          return (
              <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
              </div>
          );
      }
      if (error) {
          return (
              <div className="text-center p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-700 font-medium">{error}</p>
                      <button 
                          onClick={() => window.location.reload()}
                          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                          Retry
                      </button>
                  </div>
              </div>
          );
      }
      if (!overviewData) {
          return <div className="text-center">Could not load dashboard data.</div>;
      }

      return (
        <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <div className="bg-white rounded-lg p-3 lg:p-6 border border-gray-200">
            <div className="flex items-center">
                <div className="p-1.5 lg:p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-4 h-4 lg:w-6 lg:h-6 text-green-600" />
                </div>
                <div className="ml-2 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Today's Revenue</p>
                <p className="text-sm lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(overviewData.todaysRevenue)}</p>
                </div>
            </div>
            </div>

            <div className="bg-white rounded-lg p-3 lg:p-6 border border-gray-200">
            <div className="flex items-center">
                <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg">
                <FileText className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
                </div>
                <div className="ml-2 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Orders Today</p>
                <p className="text-sm lg:text-2xl font-bold text-gray-900 truncate">{overviewData.ordersToday}</p>
                </div>
            </div>
            </div>

            <div className="bg-white rounded-lg p-3 lg:p-6 border border-gray-200">
            <div className="flex items-center">
                <div className="p-1.5 lg:p-2 bg-purple-100 rounded-lg">
                <Users className="w-4 h-4 lg:w-6 lg:h-6 text-purple-600" />
                </div>
                <div className="ml-2 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Active Staff</p>
                <p className="text-sm lg:text-2xl font-bold text-gray-900 truncate">{overviewData.activeStaff}</p>
                </div>
            </div>
            </div>

            <div className="bg-white rounded-lg p-3 lg:p-6 border border-gray-200">
            <div className="flex items-center">
                <div className="p-1.5 lg:p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600" />
                </div>
                <div className="ml-2 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Low Stock Items</p>
                <p className="text-sm lg:text-2xl font-bold text-gray-900 truncate">{overviewData.lowStockItems}</p>
                </div>
            </div>
            </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <div className="space-y-3">
                {overviewData.recentOrders && overviewData.recentOrders.length > 0 ? (
                    overviewData.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                        <p className="font-medium text-gray-900">{order.order_number}</p>
                        <p className="text-sm text-gray-600">{order.location}</p>
                        </div>
                        <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                        <p className="text-sm text-gray-600">{timeAgo(order.created_at)}</p>
                        </div>
                    </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500">No recent orders to display.</p>
                )}
            </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('staff')} className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-900">Add Staff</span>
                </button>
                <button onClick={() => setActiveTab('inventory')} className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <Package className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-green-900">Update Inventory</span>
                </button>
                <button onClick={() => setActiveTab('reports')} className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <FileText className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-900">Generate Report</span>
                </button>
                <button onClick={() => setActiveTab('settings')} className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                <Settings className="w-8 h-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-yellow-900">System Settings</span>
                </button>
            </div>
            </div>
        </div>

        {/* Active Users & Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Users & Sessions */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    User Sessions ({activeUsers.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {activeUsers && activeUsers.length > 0 ? (
                        activeUsers.map((session) => (
                            <div key={`${session.staff_id}-${session.login_time}`} className={`flex items-center justify-between p-3 rounded-lg border ${
                                session.is_active 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{session.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 capitalize bg-gray-100 px-2 py-1 rounded-full text-xs">
                                            {session.role}
                                        </span>
                                        <span className={`text-xs ${session.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                                            • {session.is_active 
                                                ? `Logged in ${timeAgo(session.login_time)}` 
                                                : `Last logged in ${timeAgo(session.logout_time || session.login_time)}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${
                                            session.is_active 
                                                ? 'bg-green-500 animate-pulse' 
                                                : 'bg-gray-400'
                                        }`}></div>
                                        <p className={`text-sm font-medium ${
                                            session.is_active 
                                                ? 'text-green-600' 
                                                : 'text-gray-500'
                                        }`}>
                                            {session.is_active ? 'Active' : 'Offline'}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {new Date(session.login_time).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No user sessions found</p>
                            <p className="text-xs text-gray-400">Users will appear here when they log in</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Low Stock Alerts ({lowStockItems.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {lowStockItems && lowStockItems.length > 0 ? (
                        lowStockItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                <div>
                                    <p className="font-medium text-gray-900">{item.name}</p>
                                    <p className="text-sm text-gray-600 capitalize">
                                        {item.inventory_type} • {item.unit}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-red-600 font-medium">
                                        {item.current_stock} / {item.minimum_stock}
                                    </p>
                                    <p className="text-xs text-gray-500">Current / Min</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4">
                            <Package className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-green-600 font-medium">All items well stocked!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
      );
  };

  const handleSearchSelect = (result: any, type: string) => {
    console.log('Search result selected:', result, 'Type:', type);
    
    // Use the navigation utility with setActiveTab for internal navigation
    navigateToSearchResult(result, () => {}, user?.role, setActiveTab);
  };

  const renderSearch = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Global Search</h2>
          <p className="text-gray-600">Search across all system data - staff, inventory, orders, menu items, and rooms</p>
        </div>

        {/* Search Interface */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <SearchComponent
            onSelectResult={handleSearchSelect}
            placeholder="Search anything in the system..."
            autoFocus={false}
          />
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Staff</h3>
              <p className="text-xs text-gray-500">Search employees</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Inventory</h3>
              <p className="text-xs text-gray-500">Find items</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-yellow-100 rounded-lg">
                <UtensilsCrossed className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Menu</h3>
              <p className="text-xs text-gray-500">Search dishes</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Orders</h3>
              <p className="text-xs text-gray-500">Find orders</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg">
                <Bed className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Rooms</h3>
              <p className="text-xs text-gray-500">Search rooms</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'search':
        return renderSearch();
      case 'staff':
        return <StaffManagement />;
      case 'shifts':
        return <ShiftManagement />;
      case 'performance':
        return <PerformanceDashboard />;
      case 'inventory':
        return <InventoryManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'rooms':
        return <RoomManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'sales-reports':
        return <PersonalSalesReport />;
      case 'settings':
        return <SettingsManagement />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Mobile Tab Navigation */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <select 
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-base"
          >
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
            <p className="text-sm text-gray-600">Management & Analytics</p>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-yellow-100 text-yellow-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Role Badge */}
          <div className="mt-8 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">System Status</span>
            </div>
            <p className="text-xs text-gray-600">All systems operational</p>
            <p className="text-xs text-gray-600 mt-1">Access Level: {user?.role === 'admin' ? 'Full Admin' : 'Manager'}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
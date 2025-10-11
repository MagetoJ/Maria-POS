import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import StaffManagement from '../components/admin/StaffManagement';
import InventoryManagement from '../components/admin/InventoryManagement';
import MenuManagement from '../components/admin/MenuManagement';
import RoomManagement from '../components/admin/RoomManagement';
import ReportsManagement from '../components/admin/ReportsManagement';
import SettingsManagement from '../components/admin/SettingsManagement';
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
  Loader2
} from 'lucide-react';

// --- Helper Functions ---

// This function formats numbers as currency.
export const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number') {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
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


export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('pos_token');

  useEffect(() => {
      const fetchOverviewData = async () => {
          if (activeTab === 'overview') {
              setIsLoading(true);
              setError(null);
              try {
                  const response = await fetch('/api/dashboard/overview-stats', {
                      headers: { 'Authorization': `Bearer ${getToken()}` }
                  });
                  if (!response.ok) {
                      throw new Error(`Failed to fetch overview stats. Status: ${response.status}`);
                  }
                  const data = await response.json();
                  setOverviewData(data);
              } catch (error) {
                  console.error("Error fetching overview stats:", error);
                  setError("Could not load dashboard data. Please try again later.");
              } finally {
                  setIsLoading(false);
              }
          }
      };

      fetchOverviewData();
  }, [activeTab]);


  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'rooms', label: 'Room Management', icon: Bed },
    { id: 'reports', label: 'Reports', icon: FileText },
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
          return <div className="text-center text-red-500 p-4">{error}</div>;
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
        </div>
      );
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'staff':
        return <StaffManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'rooms':
        return <RoomManagement />;
      case 'reports':
        return <ReportsManagement />;
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
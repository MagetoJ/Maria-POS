import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { apiClient } from '../config/api';
import { envLog, IS_DEVELOPMENT } from '../config/environment';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import StaffManagement from '../components/admin/StaffManagement';
import MenuManagement from '../components/admin/MenuManagement';
import RoomManagement from '../components/admin/RoomManagement';
import ReportsManagement from '../components/admin/ReportsManagement';
import SettingsManagement from '../components/admin/SettingsManagement';
import ShiftManagement from '../components/admin/ShiftManagement';
import WaiterClearing from '../components/admin/WaiterClearing';
import ExpensesManagement from '../components/admin/ExpensesManagement';
import InvoicesManagement from '../components/admin/InvoicesManagement';
import InvoiceModal from '../components/admin/InvoiceModal';
import PerfomanceDashboard from '../components/PerfomanceDashboardView';
import PersonalSalesReport from '../components/PersonalSalesReport';
import SearchComponent from '../components/SearchComponent';
import { navigateToSearchResult } from '../utils/searchNavigation';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import {
  BarChart3,
  Users,
  Settings,
  FileText,
  Utensils,
  Bed,
  AlertTriangle,
  DollarSign,
  Loader2,
  Clock,
  TrendingUp,
  Search,
  Receipt,
  CheckCircle,
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
    recentOrders: {
        id: number;
        order_number: string;
        location: string;
        total_amount: number;
        created_at: string;
    }[];
}

interface ActiveUser {
  [x: string]: any;
  staff_id: any;
  is_active: any;
  logout_time: string;
  id: number;
  name: string;
  role: string;
  login_time: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  
  // Chart data state
  const [revenueData] = useState([
    { date: 'Mon', revenue: 4500 },
    { date: 'Tue', revenue: 5200 },
    { date: 'Wed', revenue: 4800 },
    { date: 'Thu', revenue: 6100 },
    { date: 'Fri', revenue: 7200 },
    { date: 'Sat', revenue: 8900 },
    { date: 'Sun', revenue: 6500 },
  ]);
  
  // Handle navigation from URL hash (for search result navigation)
  useEffect(() => {
    if (location.hash) {
      const tab = location.hash.substring(1); // Remove the # symbol
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
    }
  }, [location.hash, activeTab]);

  // Handle custom search navigation events
  useEffect(() => {
    const handleAdminSearchNavigate = (event: CustomEvent) => {
      const { tab } = event.detail;
      if (tab) {
        setActiveTab(tab);
      }
    };

    window.addEventListener('adminSearchNavigate', handleAdminSearchNavigate as EventListener);
    return () => window.removeEventListener('adminSearchNavigate', handleAdminSearchNavigate as EventListener);
  }, []);

  // Clear hash after navigation to prevent issues with back button
  useEffect(() => {
    if (location.hash && activeTab !== 'overview') {
      // Clear the hash after a short delay
      const timer = setTimeout(() => {
        window.history.replaceState(null, '', '/admin');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, location.hash]);

  const fetchActiveUsers = async (signal?: AbortSignal) => {
    try {
      envLog.dev('👥 Fetching user sessions...');
      const response = await apiClient.get('/api/admin/user-sessions', { signal });
      if (response.ok) {
        const data = await response.json();
        if (signal?.aborted) return;
        setActiveUsers(data);
        envLog.dev('✅ User sessions loaded:', data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      envLog.error('❌ Error fetching user sessions:', error);
    }
  };

  const handleGenerateInvoice = async (orderId: number) => {
    try {
      const response = await apiClient.post('/api/invoices', {
        order_id: orderId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      const data = await response.json();
      if (response.ok) {
        setSelectedInvoiceId(data.id);
      } else {
        if (data.invoice) {
          setSelectedInvoiceId(data.invoice.id);
        } else {
          toast.error(data.message || 'Failed to generate invoice');
        }
      }
    } catch (err) {
      console.error('Error generating invoice:', err);
      toast.error('Error generating invoice');
    }
  };

  useEffect(() => {
      const controller = new AbortController();
      
      const fetchOverviewData = async () => {
          if (activeTab === 'overview') {
              setIsLoading(true);
              setError(null);
              
              try {
                  envLog.dev('📊 Fetching overview stats...');
                  const response = await apiClient.get('/api/dashboard/overview-stats', { signal: controller.signal });
                  
                  if (!response.ok) {
                      throw new Error(`Failed to fetch overview stats. Status: ${response.status}`);
                  }
                  
                  const data = await response.json();
                  if (controller.signal.aborted) return;
                  
                  setOverviewData(data);
                  await fetchActiveUsers(controller.signal);
              } catch (error: any) {
                  if (error.name === 'AbortError') return;
                  envLog.error("❌ Error fetching overview stats:", error);
                  if (IS_DEVELOPMENT) {
                    setError("Could not load dashboard data. Please check your connection.");
                  } else {
                    setError("An error occurred while loading dashboard data.");
                  }
              } finally {
                  if (!controller.signal.aborted) {
                    setIsLoading(false);
                  }
              }
          }
      };

      fetchOverviewData();
      
      const intervalId = setInterval(() => {
        if (activeTab === 'overview') fetchActiveUsers();
      }, 30000);
      
      return () => {
        controller.abort();
        clearInterval(intervalId);
      };
  }, [activeTab]);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'search', label: 'Global Search', icon: Search, roles: ['admin', 'manager'] },
    { id: 'staff', label: 'Staff Management', icon: Users, roles: ['admin', 'manager'] },
    { id: 'shifts', label: 'Shift Management', icon: Clock, roles: ['admin', 'manager'] },
    { id: 'clearing', label: 'Waiter Clearing', icon: CheckCircle, roles: ['admin', 'manager'] },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'menu', label: 'Menu Management', icon: Utensils, roles: ['admin', 'manager'] },
    { id: 'rooms', label: 'Room Management', icon: Bed, roles: ['admin', 'manager'] },
    { id: 'invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'manager'] },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'sales-reports', label: 'Sales Reports', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  const activeTabLabel = menuItems.find(item => item.id === activeTab)?.label || 'Admin';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
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
        </div>

        {/* Charts Section - Revenue Over Time and Inventory Summary Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg p-4 lg:p-6 border border-gray-200">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Revenue Trend (This Week)</h3>
              <div className="w-full h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      formatter={(value: any) => `KES ${value.toLocaleString('en-KE')}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#facc15"
                      strokeWidth={2}
                      dot={{ fill: '#facc15', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Daily Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inventory Summary Placeholder */}
            <div className="bg-white rounded-lg p-4 lg:p-6 border border-gray-200">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Inventory Summary</h3>
              <div className="flex items-center justify-center h-64 lg:h-80 text-gray-400 italic">
                Low stock alerts visualization coming soon
              </div>
            </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 lg:p-6 border border-gray-200">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <div className="space-y-3">
                {overviewData.recentOrders && overviewData.recentOrders.length > 0 ? (
                    overviewData.recentOrders.map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2">
                        <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{order.order_number}</p>
                        <p className="text-sm text-gray-600 truncate">{order.location}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-left sm:text-right flex-shrink-0">
                            <p className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                            <p className="text-sm text-gray-600">{timeAgo(order.created_at)}</p>
                            </div>
                            <button
                                onClick={() => handleGenerateInvoice(order.id)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Generate Invoice"
                            >
                                <FileText className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500">No recent orders to display.</p>
                )}
            </div>
            </div>

            <div className="bg-white rounded-lg p-4 lg:p-6 border border-gray-200">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {user?.role !== 'accountant' && (
                  <button onClick={() => setActiveTab('staff')} className="flex flex-col items-center p-3 lg:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <Users className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600 mb-2" />
                    <span className="text-xs lg:text-sm font-medium text-blue-900 text-center">Add Staff</span>
                  </button>
                )}
                <button onClick={() => setActiveTab('reports')} className="flex flex-col items-center p-3 lg:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <FileText className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 mb-2" />
                <span className="text-xs lg:text-sm font-medium text-purple-900 text-center">Generate Report</span>
                </button>
                {user?.role !== 'accountant' && (
                  <button onClick={() => setActiveTab('settings')} className="flex flex-col items-center p-3 lg:p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                    <Settings className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600 mb-2" />
                    <span className="text-xs lg:text-sm font-medium text-yellow-900 text-center">System Settings</span>
                  </button>
                )}
            </div>
            </div>
        </div>

        {/* Active Users Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Users & Sessions */}
            <div className="bg-white rounded-lg p-4 lg:p-6 border border-gray-200">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                    User Sessions ({activeUsers.length})
                </h3>
                <div className="space-y-3 max-h-48 lg:max-h-64 overflow-y-auto">
                    {activeUsers && activeUsers.length > 0 ? (
                        activeUsers.map((session) => (
                            <div key={`${session.staff_id}-${session.login_time}`} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border gap-2 ${
                                session.is_active
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{session.name}</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-gray-600 capitalize bg-gray-100 px-2 py-1 rounded-full">
                                            {session.role}
                                        </span>
                                        <span className={`text-xs ${session.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                                            • {session.is_active
                                                ? `Logged in ${timeAgo(session.login_time)}`
                                                : `Last logged in ${timeAgo(session.logout_time || session.login_time)}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start sm:items-end flex-shrink-0">
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${
                                            session.is_active
                                                ? 'bg-green-500 animate-pulse'
                                                : 'bg-gray-400'
                                        }`}></div>
                                        <p className={`text-xs lg:text-sm font-medium ${
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
                            <Users className="w-8 h-8 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No user sessions found</p>
                            <p className="text-xs text-gray-400">Users will appear here when they log in</p>
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
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Staff</h3>
              <p className="text-xs text-gray-500">Search employees</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-yellow-100 rounded-lg">
                <Utensils className="w-6 h-6 text-yellow-600" />
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
      case 'clearing':
        return <WaiterClearing />;
      case 'performance':
        return <PerfomanceDashboard />;
      case 'menu':
        return <MenuManagement />;
      case 'rooms':
        return <RoomManagement />;
      case 'invoices':
        return <InvoicesManagement />;
      case 'expenses':
        return <ExpensesManagement />;
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

  const sidebarStatusCard = (
    <div className="mt-8 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="text-sm font-medium text-gray-900">System Status</span>
      </div>
      <p className="text-xs text-gray-600">All systems operational</p>
      <p className="text-xs text-gray-600 mt-1">Access Level: {user?.role === 'admin' ? 'Full Admin' : user?.role === 'accountant' ? 'Accountant' : 'Manager'}</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <div className="flex flex-1">
        <Sidebar
          title="Admin Dashboard"
          navItems={filteredMenuItems}
          activeItem={activeTab}
          onNavItemClick={setActiveTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          showMobileQuickNav={false}
        >
          {sidebarStatusCard}
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          <div className="lg:hidden sticky top-0 bg-white border-b border-gray-200 z-10">
            <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">{activeTabLabel}</h1>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-600"
                aria-label="Open sidebar"
              >
                <Utensils className="w-6 h-6" />
              </button>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {selectedInvoiceId && (
        <InvoiceModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
}
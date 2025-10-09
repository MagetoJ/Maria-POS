import { useState } from 'react';
import { useAuth } from '@/react-app/contexts/AuthContext';
import Header from '@/react-app/components/Header';
import StaffManagement from '@/react-app/components/admin/StaffManagement';
import InventoryManagement from '@/react-app/components/admin/InventoryManagement';
import MenuManagement from '@/react-app/components/admin/MenuManagement';
import RoomManagement from '@/react-app/components/admin/RoomManagement';
import ReportsManagement from '@/react-app/components/admin/ReportsManagement';
import { 
  BarChart3, 
  Users, 
  Package, 
  Settings, 
  FileText, 
  UtensilsCrossed,
  Bed,
  Clock,
  TrendingUp,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/react-app/data/mockData';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'rooms', label: 'Room Management', icon: Bed },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(85420)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm ml-1">+12% from yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orders Today</p>
              <p className="text-2xl font-bold text-gray-900">142</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm ml-1">+8% from yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500 text-sm ml-1">8 on shift now</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-yellow-600 text-sm">Requires attention</span>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {[
              { id: 'ORD-145', table: 'T03', amount: 2400, time: '2 min ago' },
              { id: 'ORD-144', room: '201', amount: 1800, time: '5 min ago' },
              { id: 'ORD-143', table: 'T07', amount: 3200, time: '8 min ago' },
              { id: 'ORD-142', table: 'T02', amount: 1500, time: '12 min ago' },
            ].map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-600">
                    {order.table ? `Table ${order.table}` : `Room ${order.room}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(order.amount)}</p>
                  <p className="text-sm text-gray-600">{order.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Add Staff</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <Package className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Update Inventory</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <FileText className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">Generate Report</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
              <Settings className="w-8 h-8 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-yellow-900">System Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlaceholder = (title: string, description: string) => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
        <Settings className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md">{description}</p>
      <button className="mt-4 px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-medium transition-colors">
        Coming Soon
      </button>
    </div>
  );

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
        return renderPlaceholder(
          'System Settings',
          'Configure API integrations, payment gateways, system preferences, and manage security settings for the POS system.'
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
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
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

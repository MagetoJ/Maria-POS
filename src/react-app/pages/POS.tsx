import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import QuickPOSHeader from '../components/QuickPOSHeader';
import OrderPanel from '../components/OrderPanel';
import MenuGrid from '../components/MenuGrid';
import RoomView from '../components/RoomView';
import DeliveryManagement from '../components/DeliveryManagement';
import DashboardView from '../components/PerfomanceDashboardView';
import TableManagementView from '../components/TableManagementView';
import { UtensilsCrossed, Building, Settings, BarChart3, LayoutGrid } from 'lucide-react';

interface POSProps {
  isQuickAccess?: boolean;
  onBackToLogin?: () => void;
}

export default function POS({ isQuickAccess = false, onBackToLogin }: POSProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'menu' | 'rooms' | 'delivery' | 'dashboard' | 'manage_tables'>('menu');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery' | 'room_service'>('dine_in');

  const canAccessRooms = user?.role === 'receptionist' || user?.role === 'manager' || user?.role === 'admin' || isQuickAccess;
  const canAccessDelivery = user?.role === 'delivery' || user?.role === 'manager' || user?.role === 'admin' || isQuickAccess;
  const canAccessDashboard = ['waiter', 'cashier', 'delivery', 'receptionist', 'manager', 'admin'].includes(user?.role ?? '');
  // **NEW LINE**: Determine if the user can manage tables
  const canManageTables = user?.role === 'receptionist';

  const renderMainContent = () => {
    switch (activeView) {
      case 'rooms':
        return <RoomView />;
      case 'delivery':
        return <DeliveryManagement />;
      case 'dashboard':
        return <DashboardView />;
      case 'manage_tables':
        return <TableManagementView />;
      default:
        return <MenuGrid />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {isQuickAccess ? <QuickPOSHeader onBackToLogin={onBackToLogin} /> : <Header />}
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Order Type Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setOrderType('dine_in'); setActiveView('menu'); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${orderType === 'dine_in' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Dine In
                </button>
                <button
                  onClick={() => { setOrderType('takeaway'); setActiveView('menu'); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${orderType === 'takeaway' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Takeaway
                </button>
                {canAccessDelivery && (
                  <button
                    onClick={() => { setOrderType('delivery'); setActiveView('delivery'); }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${orderType === 'delivery' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  >
                    Delivery
                  </button>
                )}
                {canAccessRooms && (
                  <button
                    onClick={() => { setOrderType('room_service'); setActiveView('rooms'); }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${orderType === 'room_service' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  >
                    Room Service
                  </button>
                )}
              </div>

              {/* View Controls */}
              <div className="flex gap-2">
                <button onClick={() => setActiveView('menu')} className={`p-2 rounded-lg transition-colors ${activeView === 'menu' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`} title="Menu">
                  <UtensilsCrossed className="w-5 h-5" />
                </button>
                {canAccessRooms && (
                  <button onClick={() => setActiveView('rooms')} className={`p-2 rounded-lg transition-colors ${activeView === 'rooms' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`} title="Rooms">
                    <Building className="w-5 h-5" />
                  </button>
                )}
                {/* **CHANGE**: Only show manage tables for receptionist */}
                {canManageTables && (
                  <button onClick={() => setActiveView('manage_tables')} className={`p-2 rounded-lg transition-colors ${activeView === 'manage_tables' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`} title="Manage Tables">
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                )}
                {canAccessDashboard && (
                  <button onClick={() => setActiveView('dashboard')} className={`p-2 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`} title="Dashboard">
                    <BarChart3 className="w-5 h-5" />
                  </button>
                )}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <button onClick={() => alert('Admin settings access - functionality coming soon')} className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700" title="Settings">
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {renderMainContent()}
          </div>
        </div>

        {/* Order Panel */}
        <div className="w-full lg:w-96 border-l border-gray-200 flex flex-col">
            <OrderPanel isQuickAccess={isQuickAccess} />
        </div>
      </div>
    </div>
  );
}


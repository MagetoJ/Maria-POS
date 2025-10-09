import { useState } from 'react';
import { useAuth } from '@/react-app/contexts/AuthContext';
import Header from '@/react-app/components/Header';
import OrderPanel from '@/react-app/components/OrderPanel';
import MenuGrid from '@/react-app/components/MenuGrid';
import TableLayout from '@/react-app/components/TableLayout';
import RoomView from '@/react-app/components/RoomView';
import QuickPOSHeader from '@/react-app/components/QuickPOSHeader';
import { UtensilsCrossed, Car, Building, Home, Settings } from 'lucide-react';

interface POSProps {
  isQuickAccess?: boolean;
  onBackToLogin?: () => void;
}

export default function POS({ isQuickAccess = false, onBackToLogin }: POSProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'menu' | 'tables' | 'rooms' | 'delivery'>('menu');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery' | 'room_service'>('dine_in');

  const canAccessRooms = user?.role === 'receptionist' || user?.role === 'manager' || user?.role === 'admin' || isQuickAccess;
  const canAccessDelivery = user?.role === 'delivery' || user?.role === 'manager' || user?.role === 'admin' || isQuickAccess;

  const renderMainContent = () => {
    switch (activeView) {
      case 'tables':
        return <TableLayout />;
      case 'rooms':
        return <RoomView />;
      case 'delivery':
        return (
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Management</h2>
              <p className="text-gray-600">Delivery tracking and management interface coming soon</p>
            </div>
          </div>
        );
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
          {/* Order Type Selector */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setOrderType('dine_in');
                    setActiveView('menu');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    orderType === 'dine_in'
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Dine In
                </button>
                <button
                  onClick={() => {
                    setOrderType('takeaway');
                    setActiveView('menu');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    orderType === 'takeaway'
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Takeaway
                </button>
                {canAccessDelivery && (
                  <button
                    onClick={() => {
                      setOrderType('delivery');
                      setActiveView('delivery');
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      orderType === 'delivery'
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Delivery
                  </button>
                )}
                {canAccessRooms && (
                  <button
                    onClick={() => {
                      setOrderType('room_service');
                      setActiveView('rooms');
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      orderType === 'room_service'
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Room Service
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('menu')}
                  className={`p-2 rounded-lg transition-colors ${
                    activeView === 'menu'
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Menu"
                >
                  <UtensilsCrossed className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveView('tables')}
                  className={`p-2 rounded-lg transition-colors ${
                    activeView === 'tables'
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Tables"
                >
                  <Home className="w-5 h-5" />
                </button>
                {canAccessRooms && (
                  <button
                    onClick={() => setActiveView('rooms')}
                    className={`p-2 rounded-lg transition-colors ${
                      activeView === 'rooms'
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Rooms"
                  >
                    <Building className="w-5 h-5" />
                  </button>
                )}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <button
                    onClick={() => alert('Admin settings access - functionality coming soon')}
                    className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {renderMainContent()}
        </div>

        {/* Order Panel */}
        <OrderPanel isQuickAccess={isQuickAccess} />
      </div>
    </div>
  );
}

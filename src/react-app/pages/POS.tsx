import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../contexts/POSContext';
import Header from '../components/Header';
import { navigateToSearchResult } from '../utils/searchNavigation';
import OrderPanel from '../components/OrderPanel';
import MenuGrid from '../components/MenuGrid';
import SalesDashboard from './SalesDashboard';
import RoomView from '../components/RoomView';
import DeliveryManagement from '../components/DeliveryManagement';
import DashboardView from '../components/PerfomanceDashboardView';
import TableManagementView from '../components/TableManagementView';
import MyRecentOrders from '../components/MyRecentOrders';
import WaiterClearing from '../components/admin/WaiterClearing';
import {
  Building,
  Settings,
  BarChart3,
  LayoutGrid,
  ShoppingCart,
  X,
  Menu,
  Search,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface POSProps {
  onBackToLogin?: () => void;
}

export default function POS({ onBackToLogin }: POSProps) {
  const { user, isCleared, loadingClearance } = useAuth();
  const toast = useToast();
  const { addItemToOrder } = usePOS();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'menu' | 'rooms' | 'delivery' | 'dashboard' | 'manage_tables' | 'sales_dashboard' | 'clearing'>('menu');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery' | 'room_service'>('dine_in');
  const [isOrderPanelVisible, setOrderPanelVisible] = useState(false);
  const [showRecentOrders, setShowRecentOrders] = useState(false);

  // Only show full-page loading for waiters who MUST have clearance 
  // before doing anything. For others, let them see the UI.
  if (loadingClearance && user?.role === 'waiter') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-yellow-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Daily Clearance...</h1>
          <p className="text-gray-600">Please wait while we check your status.</p>
        </div>
      </div>
    );
  }

  // If we're here and user is still null, it might be a guest session 
  // or the AuthContext hasn't finished its initial state sync.
  // We'll show a less intrusive loader or just let it pass through.
  if (!user && loadingClearance) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mb-4" />
        <p className="text-gray-600 font-medium">Synchronizing session...</p>
      </div>
    );
  }

  if (!isCleared && user?.role === 'waiter') {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-red-200 p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Clearance Required</h1>
          <div className="space-y-4 text-gray-600 mb-8">
            <p className="text-lg">
              Our records show you haven't been cleared since today's <strong>8:00 AM</strong> anchor.
            </p>
            <p className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm italic">
              "To maintain strict financial accountability, all staff must be cleared daily after 8:00 AM before starting new orders."
            </p>
            <p>Please contact an <strong>Admin</strong> or <strong>Manager</strong> to perform your Daily Clearance check.</p>
          </div>
          <button 
            onClick={onBackToLogin || (() => navigate('/login'))}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const canAccessRooms = user?.role === 'receptionist' || user?.role === 'manager' || user?.role === 'admin';
  const canAccessDelivery = user?.role === 'delivery' || user?.role === 'manager' || user?.role === 'admin';
  const canAccessDashboard = ['waiter', 'cashier', 'delivery', 'receptionist', 'manager', 'admin'].includes(user?.role ?? '');
  const canManageTables = user?.role === 'receptionist';

  useEffect(() => {
    const handlePOSSearchSelect = (event: CustomEvent) => {
      const { result, type, userRole } = event.detail;
      navigateToSearchResult(result, navigate, userRole, undefined, (view) => setActiveView(view as any));
    };

    const handlePOSAddToOrder = (event: CustomEvent) => {
      const { product } = event.detail;
      const productToAdd = {
        id: product.id,
        category_id: 1,
        name: product.title,
        description: product.description || '',
        price: product.metadata?.price || 0,
        is_available: true,
        preparation_time: 0
      };
      addItemToOrder(productToAdd, 1, orderType);
      setActiveView('menu');
    };

    window.addEventListener('posSearchSelect', handlePOSSearchSelect as EventListener);
    window.addEventListener('posAddToOrder', handlePOSAddToOrder as EventListener);
    
    return () => {
      window.removeEventListener('posSearchSelect', handlePOSSearchSelect as EventListener);
      window.removeEventListener('posAddToOrder', handlePOSAddToOrder as EventListener);
    };
  }, [navigate, addItemToOrder, orderType]);

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
      case 'sales_dashboard':
        return <SalesDashboard />;
      // case 'clearing':
      //   return <WaiterClearing />;
      default:
        return <MenuGrid />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3">
              <button
                onClick={() => { setOrderType('dine_in'); setActiveView('menu'); }}
                className={`px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${orderType === 'dine_in' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Dine In
              </button>
              <button
                onClick={() => { setOrderType('takeaway'); setActiveView('menu'); }}
                className={`px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${orderType === 'takeaway' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Takeaway
              </button>
              {canAccessDelivery && (
                <button
                  onClick={() => { setOrderType('delivery'); setActiveView('delivery'); }}
                  className={`px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${orderType === 'delivery' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Delivery
                </button>
              )}
              {canAccessRooms && (
                <button
                  onClick={() => { setOrderType('room_service'); setActiveView('rooms'); }}
                  className={`px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${orderType === 'room_service' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Room Service
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <button onClick={() => setActiveView('menu')} className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeView === 'menu' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`} title="Menu">
                <Menu className="w-5 h-5" />
              </button>
              
              <button onClick={() => setActiveView('sales_dashboard')} className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeView === 'sales_dashboard' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`} title="Sales Dashboard">
                <Search className="w-5 h-5" />
              </button>
              
              {canAccessRooms && (
                <button onClick={() => setActiveView('rooms')} className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeView === 'rooms' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`} title="Rooms">
                  <Building className="w-5 h-5" />
                </button>
              )}
              {canManageTables && (
                <button onClick={() => setActiveView('manage_tables')} className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeView === 'manage_tables' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`} title="Manage Tables">
                  <LayoutGrid className="w-5 h-5" />
                </button>
              )}
              {canAccessDashboard && (
                <button onClick={() => setActiveView('dashboard')} className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeView === 'dashboard' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`} title="Dashboard">
                  <BarChart3 className="w-5 h-5" />
                </button>
              )}
              
              {/* {['waiter', 'manager', 'admin'].includes(user?.role ?? '') && (
                <button 
                  onClick={() => setActiveView('clearing')} 
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeView === 'clearing' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`} 
                  title="My Receipts / Clearing"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              )} */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button onClick={() => toast.info('Admin settings access - functionality coming soon')} className="p-2 rounded-lg transition-colors text-gray-500 hover:bg-gray-100 flex-shrink-0" title="Settings">
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {renderMainContent()}
          </div>
          
          <div className="absolute bottom-4 right-4 lg:hidden">
            <button
              onClick={() => setOrderPanelVisible(true)}
              className="bg-yellow-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
            >
              <ShoppingCart size={24} />
            </button>
          </div>
        </div>

        <div
          className={`
            fixed top-0 right-0 h-full bg-white border-l border-gray-200 z-20
            w-full max-w-md transform transition-transform duration-300 ease-in-out
            lg:relative lg:w-96 lg:max-w-none lg:transform-none
            ${isOrderPanelVisible ? 'translate-x-0' : 'translate-x-full'}
            lg:translate-x-0
          `}
        >
          <button
            onClick={() => setOrderPanelVisible(false)}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 lg:hidden"
          >
            <X size={24} />
          </button>
          <OrderPanel />
        </div>
      </div>

      {showRecentOrders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
              <button 
                onClick={() => setShowRecentOrders(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <MyRecentOrders />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth, User } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../contexts/POSContext';
import { apiClient } from '../config/api';
import Header from '../components/Header';
import { navigateToSearchResult } from '../utils/searchNavigation';
import QuickPOSHeader from '../components/QuickPOSHeader';
import OrderPanel from '../components/OrderPanel';
import MenuGrid from '../components/MenuGrid';
import SalesDashboard from './SalesDashboard';
import RoomView from '../components/RoomView';
import DeliveryManagement from '../components/DeliveryManagement';
import DashboardView from '../components/PerfomanceDashboardView';
import TableManagementView from '../components/TableManagementView';
import BarSales from '../components/BarSales';
import QuickBarSalesPanel from '../components/QuickBarSalesPanel';
import MyRecentOrders from '../components/MyRecentOrders';
import {
  Building,
  Settings,
  BarChart3,
  LayoutGrid,
  ShoppingCart,
  X,
  Wine,
  Menu,
  Search,
  User as UserIcon,
  Loader2,
} from 'lucide-react';

interface POSProps {
  isQuickAccess?: boolean;
  onBackToLogin?: () => void;
}

export default function POS({ isQuickAccess = false, onBackToLogin }: POSProps) {
  const { user } = useAuth();
  const { addItemToOrder } = usePOS();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'menu' | 'rooms' | 'delivery' | 'dashboard' | 'manage_tables' | 'bar_sales' | 'quick_bar_sales' | 'sales_dashboard'>('menu');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery' | 'room_service'>('dine_in');
  // State to manage order panel visibility on mobile
  const [isOrderPanelVisible, setOrderPanelVisible] = useState(false);
  // State for quick POS header
  const [isBarMode, setIsBarMode] = useState(false);
  const [showRecentOrders, setShowRecentOrders] = useState(false);

  // PIN verification for Quick POS access to sensitive actions
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<'recent_orders' | 'generate_invoice' | null>(null);
  const [waitersList, setWaitersList] = useState<User[]>([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const { validateStaffPin } = useAuth();

  const canAccessRooms = user?.role === 'receptionist' || user?.role === 'manager' || user?.role === 'admin' || isQuickAccess;
  const canAccessDelivery = user?.role === 'delivery' || user?.role === 'manager' || user?.role === 'admin' || isQuickAccess;
  const canAccessDashboard = ['waiter', 'cashier', 'delivery', 'receptionist', 'manager', 'admin'].includes(user?.role ?? '');
  const canManageTables = user?.role === 'receptionist';
  const canAccessBarSales = ['waiter', 'cashier', 'receptionist', 'manager', 'admin'].includes(user?.role ?? '') || isQuickAccess;

  // Handle search results from header search
  useEffect(() => {
    const handlePOSSearchSelect = (event: CustomEvent) => {
      const { result, type, userRole } = event.detail;
      console.log('POS handling search result:', result, 'Type:', type);
      
      // Use the navigation utility with POS-specific context
      navigateToSearchResult(result, navigate, userRole, undefined, setActiveView);
    };

    const handlePOSAddToOrder = (event: CustomEvent) => {
      const { product } = event.detail;
      console.log('POS adding product to order:', product);
      
      // Convert search result to product format and add to order
      const productToAdd = {
        id: product.id,
        category_id: 1, // Default category, can be extracted from metadata if needed
        name: product.title,
        description: product.description || '',
        price: product.metadata?.price || 0,
        is_available: true,
        preparation_time: 0
      };
      
      addItemToOrder(productToAdd, 1, orderType);
      
      // Switch to menu view to show the order has been added
      setActiveView('menu');
    };

    // Listen for search events
    window.addEventListener('posSearchSelect', handlePOSSearchSelect as EventListener);
    window.addEventListener('posAddToOrder', handlePOSAddToOrder as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('posSearchSelect', handlePOSSearchSelect as EventListener);
      window.removeEventListener('posAddToOrder', handlePOSAddToOrder as EventListener);
    };
  }, [navigate, addItemToOrder, orderType]);

  const fetchWaiters = async () => {
    try {
      const response = await apiClient.get('/api/staff/waiters');
      if (response.ok) {
        const data = await response.json();
        setWaitersList(data);
      }
    } catch (error) {
      console.error('Failed to fetch waiters:', error);
    }
  };

  const handleRecentOrdersClick = () => {
    if (isQuickAccess) {
      setPinAction('recent_orders');
      if (waitersList.length === 0) fetchWaiters();
      setShowPinModal(true);
    } else {
      setShowRecentOrders(true);
    }
  };

  const handleGenerateInvoiceClick = () => {
    if (isQuickAccess) {
      setPinAction('generate_invoice');
      if (waitersList.length === 0) fetchWaiters();
      setShowPinModal(true);
    } else {
      setShowRecentOrders(true);
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setPinError('');
    }
  };

  const clearPin = () => {
    setPin('');
    setPinError('');
  };

  const backspacePin = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinVerification = async () => {
    if (!selectedWaiterId || pin.length !== 4) return;

    setIsSubmittingPin(true);
    setPinError('');

    try {
      const selectedWaiter = waitersList.find(w => w.id === parseInt(selectedWaiterId));
      if (!selectedWaiter) {
        setPinError('Selected waiter not found');
        return;
      }

      const isValid = await validateStaffPin(selectedWaiter.username, pin);
      
      if (isValid) {
        setShowPinModal(false);
        setPin('');
        setSelectedWaiterId('');
        setShowRecentOrders(true);
      } else {
        setPinError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setPinError('Verification failed. Please try again.');
    } finally {
      setIsSubmittingPin(false);
    }
  };

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
      case 'bar_sales':
        return <BarSales />;
      case 'quick_bar_sales':
        return <QuickBarSalesPanel isQuickAccess={isQuickAccess} />;
      case 'sales_dashboard':
        return <SalesDashboard />;
      default:
        return <MenuGrid />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      {isQuickAccess ? (
        <QuickPOSHeader 
          onLogout={onBackToLogin || (() => {})}
          toggleBarMode={() => setIsBarMode(!isBarMode)}
          isBarMode={isBarMode}
          setShowRecentOrders={handleRecentOrdersClick}
          onGenerateInvoiceClick={handleGenerateInvoiceClick}
        />
      ) : <Header />}

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Top Bar with controls */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
            {/* First Row: Order Type Controls (scrollable on mobile) */}
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

            {/* Second Row: View Controls - Always Visible Icons */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Always show Menu button */}
              <button onClick={() => setActiveView('menu')} className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeView === 'menu' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`} title="Menu">
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Sales Dashboard - integrated search & mode switching */}
              <button onClick={() => setActiveView('sales_dashboard')} className={`p-2 rounded-lg transition-colors flex-shrink-0 ${activeView === 'sales_dashboard' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`} title="Sales Dashboard">
                <Search className="w-5 h-5" />
              </button>
              
              {/* Show Bar Sales button - always available in Quick POS, role-based for regular users */}
              {canAccessBarSales && (
                <button
                  onClick={() => setActiveView(isQuickAccess ? 'quick_bar_sales' : 'bar_sales')}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${(activeView === 'quick_bar_sales' || activeView === 'bar_sales') ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="Bar Sales (Wine)"
                >
                  <Wine className="w-5 h-5" />
                </button>
              )}
              
              {/* Remaining buttons - can scroll if needed */}
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
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button onClick={() => alert('Admin settings access - functionality coming soon')} className="p-2 rounded-lg transition-colors text-gray-500 hover:bg-gray-100 flex-shrink-0" title="Settings">
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {renderMainContent()}
          </div>
          
          {/* Mobile "View Order" Button */}
          <div className="absolute bottom-4 right-4 lg:hidden">
            <button
              onClick={() => setOrderPanelVisible(true)}
              className="bg-yellow-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
            >
              <ShoppingCart size={24} />
            </button>
          </div>
        </div>

        {/* Order Panel (Side panel) */}
        <div
          className={`
            fixed top-0 right-0 h-full bg-white border-l border-gray-200 z-20
            w-full max-w-md transform transition-transform duration-300 ease-in-out
            lg:relative lg:w-96 lg:max-w-none lg:transform-none
            ${isOrderPanelVisible ? 'translate-x-0' : 'translate-x-full'}
            lg:translate-x-0
          `}
        >
          {/* Close button for mobile overlay */}
          <button
            onClick={() => setOrderPanelVisible(false)}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 lg:hidden"
          >
            <X size={24} />
          </button>
          <OrderPanel isQuickAccess={isQuickAccess} />
        </div>
      </div>

      {/* Recent Orders Modal */}
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
              <MyRecentOrders isQuickAccess={isQuickAccess} />
            </div>
          </div>
        </div>
      )}
      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              <UserIcon className="w-5 h-5 text-indigo-600" />
              Staff Authentication Required
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Please select your name and enter your PIN to access {pinAction === 'generate_invoice' ? 'invoice generation' : 'recent orders'}.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Name *
              </label>
              <select
                value={selectedWaiterId}
                onChange={(e) => setSelectedWaiterId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                disabled={isSubmittingPin}
              >
                <option value="">-- Choose your name --</option>
                {waitersList.map((waiter) => (
                  <option key={waiter.id} value={waiter.id}>
                    {waiter.name} ({waiter.employee_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Your PIN *
              </label>
              <input
                type="password"
                value={pin}
                readOnly
                className="w-full p-3 text-center text-2xl tracking-widest border border-gray-300 rounded-md mb-4 bg-gray-50"
                placeholder="••••"
                maxLength={4}
              />
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinInput(digit.toString())}
                    disabled={pin.length >= 4 || isSubmittingPin}
                    className="h-12 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold text-lg transition-colors disabled:opacity-50"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearPin}
                  disabled={isSubmittingPin}
                  className="h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-md text-sm font-semibold transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handlePinInput('0')}
                  disabled={pin.length >= 4 || isSubmittingPin}
                  className="h-12 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold text-lg transition-colors disabled:opacity-50"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={backspacePin}
                  disabled={isSubmittingPin}
                  className="h-12 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold text-lg transition-colors"
                >
                  ←
                </button>
              </div>
            </div>

            {pinError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm text-center font-medium">{pinError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinError('');
                  setPin('');
                  setSelectedWaiterId('');
                  setPinAction(null);
                }}
                disabled={isSubmittingPin}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePinVerification}
                disabled={isSubmittingPin || !selectedWaiterId || pin.length !== 4}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold flex justify-center items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingPin ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Verifying...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
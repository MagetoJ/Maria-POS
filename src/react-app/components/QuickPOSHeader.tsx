import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Wine, ShoppingBag, History } from 'lucide-react';

interface QuickPOSHeaderProps {
  onLogout: () => void;
  toggleBarMode: () => void;
  isBarMode: boolean;
  setShowRecentOrders: (show: boolean) => void;
}

const QuickPOSHeader: React.FC<QuickPOSHeaderProps> = ({
  onLogout,
  toggleBarMode,
  isBarMode,
  setShowRecentOrders
}) => {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-100 p-2 rounded-full">
          <ShoppingBag className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Quick POS</h1>
          <p className="text-xs text-gray-500">
            {user ? `${user.name} (${user.role})` : 'Guest User'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Recent Orders Button */}
        <button
          onClick={() => setShowRecentOrders(true)}
          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          title="Recent Orders"
        >
          <History className="h-6 w-6" />
        </button>

        {/* Bar Mode Toggle - Always Visible */}
        <button
          onClick={toggleBarMode}
          className={`p-2 rounded-full transition-colors ${
            isBarMode
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
          }`}
          title={isBarMode ? "Switch to Kitchen Menu" : "Switch to Bar Menu"}
        >
          <Wine className="h-6 w-6" />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>

        <button
          onClick={onLogout}
          className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default QuickPOSHeader;
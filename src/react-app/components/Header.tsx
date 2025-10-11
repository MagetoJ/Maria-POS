import { useAuth } from '@/react-app/contexts/AuthContext';
import { LogOut, User, Clock } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      admin: 'Administrator',
      manager: 'Manager',
      cashier: 'Cashier',
      waiter: 'Waiter',
      kitchen_staff: 'Kitchen Staff',
      delivery: 'Delivery',
      receptionist: 'Receptionist',
      housekeeping: 'Housekeeping'
    };
    return roleMap[role] || role;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black rounded-sm flex items-center justify-center relative">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-sm"></div>
                <div className="absolute top-0 right-0 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-sm"></div>
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Maria Havens POS</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Hotel & Restaurant System</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleTimeString('en-KE', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-lg px-2 py-1 sm:px-4 sm:py-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <div className="text-xs sm:text-sm min-w-0">
              <div className="font-medium text-gray-900 truncate">{user?.name}</div>
              <div className="text-gray-500 hidden sm:block truncate">{getRoleDisplayName(user?.role || '')}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-red-600 transition-colors p-1 sm:p-2 rounded-lg hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

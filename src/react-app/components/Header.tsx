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
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center relative">
                <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-sm"></div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Maria Havens POS</h1>
              <p className="text-sm text-gray-500">Hotel & Restaurant System</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleTimeString('en-KE', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
            <User className="w-5 h-5 text-gray-600" />
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user?.name}</div>
              <div className="text-gray-500">{getRoleDisplayName(user?.role || '')}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

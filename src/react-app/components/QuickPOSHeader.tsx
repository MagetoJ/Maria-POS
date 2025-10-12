import { LogOut, Clock } from 'lucide-react';

interface QuickPOSHeaderProps {
  onBackToLogin?: () => void;
}

export default function QuickPOSHeader({ onBackToLogin }: QuickPOSHeaderProps) {
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
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Maria Havens Quick POS</h1>
              <p className="text-xs sm:text-sm text-gray-500">No Login Required - PIN Authentication</p>
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
          
          <div className="flex items-center gap-2 sm:gap-3 bg-yellow-50 rounded-lg px-2 py-1 sm:px-4 sm:py-2 border border-yellow-200">
            <div className="text-xs sm:text-sm min-w-0">
              <div className="font-medium text-yellow-900">Quick Access Mode</div>
              <div className="text-yellow-700 hidden sm:block">Select waiter at checkout</div>
            </div>
          </div>

          {onBackToLogin && (
            <button
              onClick={onBackToLogin}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-red-600 transition-colors p-1 sm:p-2 rounded-lg hover:bg-red-50"
              title="Back to Login"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-sm">Exit</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
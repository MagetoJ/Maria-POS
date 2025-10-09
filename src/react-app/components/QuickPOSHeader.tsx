import { useState } from 'react';
import { User, Clock, ArrowLeft } from 'lucide-react';

interface QuickPOSHeaderProps {
  onBackToLogin?: () => void;
}

export default function QuickPOSHeader({ onBackToLogin }: QuickPOSHeaderProps) {
  const [selectedWaiter, setSelectedWaiter] = useState<any>(null);
  const [showWaiterSelection, setShowWaiterSelection] = useState(false);

  // Mock waiter data - in real app this would come from API
  const waiters = [
    { id: 1, employee_id: 'EMP002', name: 'Mary Waiter', pin: '5678' },
    { id: 2, employee_id: 'EMP009', name: 'John Server', pin: '1122' },
    { id: 3, employee_id: 'EMP010', name: 'Alice Service', pin: '3344' },
    { id: 4, employee_id: 'EMP011', name: 'Bob Wait', pin: '5566' },
  ];

  const handleWaiterSelect = (waiter: any) => {
    setSelectedWaiter(waiter);
    setShowWaiterSelection(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Back to Login"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center relative">
                <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-sm"></div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Maria Havens POS</h1>
              <p className="text-sm text-gray-500">Quick Access Mode</p>
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
          
          <div className="flex items-center gap-3">
            {selectedWaiter ? (
              <div 
                onClick={() => setShowWaiterSelection(true)}
                className="flex items-center gap-3 bg-green-50 rounded-lg px-4 py-2 cursor-pointer hover:bg-green-100 transition-colors"
              >
                <User className="w-5 h-5 text-green-600" />
                <div className="text-sm">
                  <div className="font-medium text-green-900">{selectedWaiter.name}</div>
                  <div className="text-green-600">Active Waiter</div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowWaiterSelection(true)}
                className="flex items-center gap-3 bg-yellow-50 rounded-lg px-4 py-2 hover:bg-yellow-100 transition-colors"
              >
                <User className="w-5 h-5 text-yellow-600" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-900">Select Waiter</div>
                  <div className="text-yellow-600">Required for orders</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Waiter Selection Modal */}
      {showWaiterSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Select Waiter</h3>
              <button
                onClick={() => setShowWaiterSelection(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {waiters.map((waiter) => (
                <button
                  key={waiter.id}
                  onClick={() => handleWaiterSelect(waiter)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    selectedWaiter?.id === waiter.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-6 h-6 text-gray-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{waiter.name}</div>
                    <div className="text-sm text-gray-500">ID: {waiter.employee_id}</div>
                  </div>
                  {selectedWaiter?.id === waiter.id && (
                    <div className="ml-auto w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowWaiterSelection(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

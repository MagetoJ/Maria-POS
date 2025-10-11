import { useState } from 'react';
import { usePOS } from '../contexts/POSContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../data/mockData';
import { Plus, Minus, Trash2, Receipt, CreditCard, Banknote, Smartphone, Building, Loader2, User } from 'lucide-react';

interface OrderPanelProps {
  isQuickAccess?: boolean;
}

export default function OrderPanel({ isQuickAccess = false }: OrderPanelProps) {
  const { currentOrder, removeItemFromOrder, updateItemQuantity, clearOrder } = usePOS();
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  if (!currentOrder || currentOrder.items.length === 0) {
    return (
      <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 lg:p-6 flex flex-col items-center justify-center text-gray-500">
        <Receipt className="w-12 h-12 lg:w-16 lg:h-16 mb-4 text-gray-300" />
        <p className="text-base lg:text-lg font-medium">No active order</p>
        <p className="text-sm text-center">Add items to start creating an order</p>
      </div>
    );
  }

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPayment(false);
    setShowPinVerification(true);
  };

  const handlePinVerification = async () => {
    if (!username || !pin) {
      setPinError('Please enter both Username and PIN');
      return;
    }

    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    setIsVerifying(true);
    setPinError('');

    try {
      // Prepare order data with staff credentials for backend validation
      const orderToSubmit = {
        ...currentOrder,
        order_number: `ORD-${Date.now()}`,
        staff_username: username, // Send username for backend validation
        pin: pin, // Send PIN for backend validation (not stored)
        payment_method: selectedPaymentMethod,
        payment_status: 'paid',
        status: 'pending',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      const token = localStorage.getItem('pos_token') || localStorage.getItem('token');
      console.log('Submitting order with PIN authentication');
      
      const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderToSubmit)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to submit order' }));
          console.error('Order submission error:', errorData);
          
          // Show specific error for invalid credentials
          if (response.status === 401) {
            setPinError('Invalid username or PIN. Please try again.');
          } else if (response.status === 400) {
            setPinError(errorData.message || 'Invalid request. Please check your inputs.');
          } else {
            setPinError(errorData.message || 'Failed to submit order');
          }
          setIsVerifying(false);
          return;
      }

      const result = await response.json();
      console.log('Order submitted successfully:', result);

      // Show receipt with staff name from backend response
      setCompletedOrder({ 
        ...orderToSubmit, 
        staff_name: result.staff_name || username 
      });
      setShowReceipt(true);
      clearOrder();
      resetPinForm();
    } catch (error) {
      console.error('Order submission error:', error);
      setPinError(`Order submission failed: ${(error as Error).message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const resetPinForm = () => {
    setShowPinVerification(false);
    setUsername('');
    setPin('');
    setPinError('');
    setSelectedPaymentMethod('');
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setPinError(''); // Clear error when user starts typing
    }
  };

  const clearPin = () => {
    setPin('');
    setPinError('');
  };

  const backspacePin = () => {
    setPin(prev => prev.slice(0, -1));
    setPinError('');
  };

  const printReceipt = () => {
    window.print();
  };

  if (showPayment) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Payment</h3>
          <button
            onClick={() => setShowPayment(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span className="text-green-600">{formatCurrency(currentOrder.total_amount)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handlePaymentMethodSelect('Cash')}
            className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            <Banknote className="w-6 h-6 text-green-600" />
            <span className="font-medium text-green-700">Cash Payment</span>
          </button>

          <button
            onClick={() => handlePaymentMethodSelect('Card')}
            className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span className="font-medium text-blue-700">Card Payment</span>
          </button>

          <button
            onClick={() => handlePaymentMethodSelect('Mobile Money')}
            className="w-full flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
          >
            <Smartphone className="w-6 h-6 text-orange-600" />
            <span className="font-medium text-orange-700">M-Pesa / Airtel Money</span>
          </button>

          {(user?.role === 'receptionist' || user?.role === 'manager' || user?.role === 'admin') && (
            <button
              onClick={() => handlePaymentMethodSelect('Room Charge')}
              className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              <Building className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-purple-700">Post to Room</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // PIN Verification Modal
  if (showPinVerification) {
    return (
      <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            Staff Verification
          </h3>
          <button
            onClick={resetPinForm}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-800">Secure Order Authentication</div>
                <div className="text-blue-700">Enter your credentials to authorize this {formatCurrency(currentOrder?.total_amount || 0)} {selectedPaymentMethod} payment</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                setPinError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter your username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN (4 digits)
            </label>
            <input
              type="password"
              value={pin}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg tracking-widest mb-4"
              placeholder="••••"
              maxLength={4}
            />
            
            {/* PIN Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6,7,8,9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinInput(digit.toString())}
                  className="h-12 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold transition-colors text-lg"
                  disabled={pin.length >= 4}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={clearPin}
                className="h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-md text-sm font-semibold transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handlePinInput('0')}
                className="h-12 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold transition-colors text-lg"
                disabled={pin.length >= 4}
              >
                0
              </button>
              <button
                type="button"
                onClick={backspacePin}
                className="h-12 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold transition-colors text-lg"
              >
                ←
              </button>
            </div>
          </div>

          {pinError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              {pinError}
            </div>
          )}

          <button
            onClick={handlePinVerification}
            disabled={isVerifying || !username || pin.length !== 4}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying & Processing...
              </>
            ) : (
              'Authorize & Complete Payment'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Receipt Modal
  if (showReceipt && completedOrder) {
    return (
      <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 lg:p-6">
        <div className="print:w-full print:max-w-none print:p-4">
          {/* Receipt Header */}
          <div className="text-center mb-6 print:mb-4">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center relative">
                  <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
                  <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-sm"></div>
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Maria Havens</h2>
            <p className="text-sm text-gray-600">Hotel & Restaurant</p>
            <p className="text-xs text-gray-500 mt-1">P.O. Box 123, Nairobi, Kenya</p>
            <p className="text-xs text-gray-500">Tel: +254 700 123 456</p>
          </div>

          {/* Receipt Details */}
          <div className="border-t border-b border-gray-200 py-4 mb-4 text-sm">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-semibold">{completedOrder.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(completedOrder.completed_at).toLocaleString('en-KE')}</span>
            </div>
            <div className="flex justify-between">
              <span>Served by:</span>
              <span>{completedOrder.staff_name}</span>
            </div>
            {completedOrder.location && (
              <div className="flex justify-between">
                <span>Location:</span>
                <span>{completedOrder.location}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-4">
            {completedOrder.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm mb-2">
                <div className="flex-1">
                  <div>{item.product?.name || 'Item'}</div>
                  <div className="text-gray-500 text-xs">
                    {item.quantity} × {formatCurrency(item.unit_price)}
                  </div>
                </div>
                <div className="font-semibold">
                  {formatCurrency(item.total_price)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(completedOrder.subtotal)}</span>
            </div>
            {completedOrder.service_charge > 0 && (
              <div className="flex justify-between">
                <span>Service Charge (10%):</span>
                <span>{formatCurrency(completedOrder.service_charge)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>VAT (16%):</span>
              <span>{formatCurrency(completedOrder.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span>{formatCurrency(completedOrder.total_amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Payment Method:</span>
              <span className="capitalize">{completedOrder.payment_method}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-gray-500">
            <p>Thank you for dining with us!</p>
            <p className="mt-1">Visit us again soon</p>
          </div>
        </div>

        {/* Print/Close Buttons */}
        <div className="flex gap-2 mt-6 print:hidden">
          <button
            onClick={printReceipt}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Print Receipt
          </button>
          <button
            onClick={() => {
              setShowReceipt(false);
              setCompletedOrder(null);
            }}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Current Order</h3>
        <span className="text-sm text-gray-500">
          Order by: {user?.name}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {currentOrder.items.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                  <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} each</p>
                </div>
                <button
                  onClick={() => removeItemFromOrder(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="font-semibold">{formatCurrency(item.total_price)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(currentOrder.subtotal)}</span>
          </div>
          {currentOrder.service_charge > 0 && (
            <div className="flex justify-between">
              <span>Service Charge (10%):</span>
              <span>{formatCurrency(currentOrder.service_charge)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>VAT (16%):</span>
            <span>{formatCurrency(currentOrder.tax_amount)}</span>
          </div>
          {currentOrder.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-{formatCurrency(currentOrder.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
            <span>Total:</span>
            <span>{formatCurrency(currentOrder.total_amount)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={clearOrder}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
          >
            Clear Order
          </button>
          <button
            onClick={() => setShowPayment(true)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-lg font-medium transition-colors"
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
}
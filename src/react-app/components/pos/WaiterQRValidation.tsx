import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';
import { 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  CreditCard, 
  Banknote, 
  MessageSquare, 
  MapPin,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

interface Order {
  id: number;
  order_number: string;
  order_type: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  table_number?: string;
  special_instructions?: string;
  created_at: string;
  items: OrderItem[];
}

export default function WaiterQRValidation() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const toast = useToast();

  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    order: Order | null;
    paymentMethod: string;
    transactionCode: string;
  }>({
    isOpen: false,
    order: null,
    paymentMethod: 'cash',
    transactionCode: ''
  });

  const fetchPendingQROrders = async () => {
    try {
      setIsLoading(true);
      // Fetch orders with status=pending and order_type=self_service
      const response = await apiClient.get('/api/orders?status=pending&order_type=self_service');
      if (response.ok) {
        setOrders(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch QR orders:', error);
      toast.error('Failed to load pending QR orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingQROrders();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingQROrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteOrder = async () => {
    const { order, paymentMethod, transactionCode } = validationModal;
    if (!order || !user) return;

    if (paymentMethod === 'mobile_money' && !transactionCode) {
      toast.error('Transaction code is required for Mpesa payments');
      return;
    }

    setIsSubmitting(order.id);
    try {
      const response = await apiClient.put(`/api/orders/${order.id}/complete-self-service`, {
        waiter_id: user.id,
        payment_method: paymentMethod,
        transaction_code: transactionCode
      });

      if (response.ok) {
        toast.success(`Order ${order.order_number} completed successfully`);
        setOrders(prev => prev.filter(o => o.id !== order.id));
        setValidationModal({ isOpen: false, order: null, paymentMethod: 'cash', transactionCode: '' });
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.table_number && order.table_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 text-yellow-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Checking for new QR orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-yellow-500" />
            QR Menu Orders
          </h2>
          <p className="text-gray-500 text-sm font-medium">Waiters must verify payment before completing these orders</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Table or Order #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 outline-none w-full md:w-64"
            />
          </div>
          <button 
            onClick={fetchPendingQROrders}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <div 
              key={order.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</span>
                    <span className="font-black text-gray-900">{order.order_number}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-500">Placed {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                {order.table_number && (
                  <div className="bg-yellow-500 text-white px-3 py-1.5 rounded-xl font-black text-sm shadow-lg shadow-yellow-100">
                    TBL: {order.table_number}
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <MapPin className="w-3 h-3" />
                    Order Items
                  </div>
                  <div className="space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-700">
                          <span className="text-yellow-600 mr-1">{item.quantity}×</span> {item.product_name}
                        </span>
                        <span className="text-gray-400 font-medium">{(item.total_price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.special_instructions && (
                  <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex gap-3">
                    <MessageSquare className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">Customer Note</p>
                      <p className="text-xs text-red-600 font-bold italic">"{order.special_instructions}"</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 pt-0 mt-auto">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Due</span>
                    <span className="text-2xl font-black text-gray-900 italic">
                      KES {order.total_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.payment_method === 'mobile_money' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.payment_method === 'mobile_money' ? 'MPESA' : order.payment_method.toUpperCase()}
                  </div>
                </div>

                <button 
                  onClick={() => setValidationModal({ 
                    isOpen: true, 
                    order, 
                    paymentMethod: order.payment_method, 
                    transactionCode: '' 
                  })}
                  className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  VERIFY & COMPLETE
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 py-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-gray-900">No Pending QR Orders</h3>
          <p className="text-gray-400 font-medium max-w-xs mx-auto mt-2">New self-service orders from customers will appear here automatically.</p>
        </div>
      )}

      {/* Validation Modal */}
      {validationModal.isOpen && validationModal.order && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setValidationModal(p => ({ ...p, isOpen: false }))}></div>
          <div className="bg-white w-full max-w-md rounded-[40px] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-4">
              <div className="w-16 h-16 bg-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-100">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 text-center tracking-tight mb-2">Complete Order</h3>
              <p className="text-gray-500 text-center font-medium text-sm">Please verify the payment details before finalizing the order.</p>
            </div>

            <div className="p-8 pt-0 space-y-6">
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Amount</span>
                  <span className="text-2xl font-black text-gray-900 italic">KES {validationModal.order.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Table</span>
                  <span className="font-black text-yellow-600">{validationModal.order.table_number || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'CASH', icon: Banknote },
                    { id: 'mobile_money', label: 'MPESA', icon: Smartphone },
                    { id: 'card', label: 'CARD', icon: CreditCard }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setValidationModal(p => ({ ...p, paymentMethod: method.id }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all duration-300 ${
                        validationModal.paymentMethod === method.id
                          ? 'bg-yellow-500 border-yellow-500 text-white shadow-xl shadow-yellow-100 scale-105'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-yellow-200 hover:text-yellow-600'
                      }`}
                    >
                      <method.icon className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-wider">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {validationModal.paymentMethod === 'mobile_money' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Code</label>
                  <input 
                    type="text" 
                    placeholder="E.g. RK89S7X4..."
                    value={validationModal.transactionCode}
                    onChange={(e) => setValidationModal(p => ({ ...p, transactionCode: e.target.value.toUpperCase() }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 font-black text-lg focus:ring-2 focus:ring-yellow-500 outline-none uppercase placeholder:text-gray-300"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setValidationModal(p => ({ ...p, isOpen: false }))}
                  className="flex-1 py-5 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleCompleteOrder}
                  disabled={isSubmitting !== null}
                  className="flex-[2] bg-gray-900 hover:bg-black text-white py-5 rounded-3xl font-black shadow-2xl transition-all active:scale-95 disabled:bg-gray-300 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      CONFIRM & COMPLETE
                      <ExternalLink className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Clock, CheckCircle, ChefHat } from 'lucide-react';
import { API_URL } from '../config/api';
interface KitchenOrderItem {
  id: number;
  product_name: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready';
  preparation_time: number;
}

interface KitchenOrder {
  id: number;
  order_number: string;
  table_number?: string;
  room_number?: string;
  order_type: string;
  items: KitchenOrderItem[];
  total_time: number;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchKitchenOrders = async () => {
    const token = localStorage.getItem('pos_token');
    try {
      const response = await fetch(`${API_URL}/api/orders/kitchen?limit=10&offset=0`, {

        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const processedData = data.map((o: any) => ({
          ...o,
          priority: o.items.length > 2 ? 'high' : 'medium',
          total_time: Math.max(...o.items.map((i: any) => i.preparation_time || 0)),
        }));
        setOrders(processedData);
      } else {
        console.error('Failed to fetch kitchen orders.');
      }
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // WebSocket setup
    const wsUrl = window.location.protocol === 'https:' 
      ? `wss://${window.location.host}/ws/kitchen`
      : `ws://${window.location.host}/ws/kitchen`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('✅ WebSocket connected for KDS');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'new_order') {
        console.log('New order received, refreshing...');
        fetchKitchenOrders();
      }
    };
    ws.onclose = () => console.log('⚠️ WebSocket disconnected for KDS');

    return () => {
      clearInterval(timer);
      ws.close();
    };
  }, []);

  const updateItemStatus = (orderId: number, itemId: number, status: 'pending' | 'preparing' | 'ready') => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, items: order.items.map((item) => (item.id === itemId ? { ...item, status } : item)) }
          : order
      )
    );
  };

  const markOrderComplete = (orderId: number) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    alert('Order marked as complete and sent to service staff');
  };

  const getElapsedTime = (createdAt: string) => {
    const created = new Date(createdAt);
    return Math.floor((currentTime.getTime() - created.getTime()) / 1000 / 60);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500 text-white';
      case 'preparing': return 'bg-yellow-500 text-white';
      case 'pending': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Kitchen Display System</h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Active orders and preparation status
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString('en-KE', { hour12: true })}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {orders.map((order) => {
            const elapsed = getElapsedTime(order.created_at);
            const isOverdue = elapsed > order.total_time;
            const allItemsReady = order.items.every((item) => item.status === 'ready');

            return (
              <div
                key={order.id}
                className={`bg-white rounded-lg border-2 p-3 sm:p-4 shadow-sm transition-all ${
                  isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                } ${allItemsReady ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {order.order_number}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {order.table_number
                        ? `Table ${order.table_number}`
                        : `Room ${order.room_number}`}{' '}
                      • {order.order_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:text-right gap-2 sm:gap-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        order.priority
                      )}`}
                    >
                      {order.priority.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}>
                        {elapsed}m / {order.total_time}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 mb-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {item.product_name}
                          </span>
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            x{item.quantity}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Est. {item.preparation_time} minutes
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => updateItemStatus(order.id, item.id, 'preparing')}
                            className="px-2 sm:px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs sm:text-sm rounded-md"
                          >
                            Start
                          </button>
                        )}
                        {item.status === 'preparing' && (
                          <button
                            onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                            className="px-2 sm:px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm rounded-md"
                          >
                            Ready
                          </button>
                        )}
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {allItemsReady && (
                  <button
                    onClick={() => markOrderComplete(order.id)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark Order Complete
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No active orders</h3>
            <p className="text-gray-600">New orders will appear here automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '@/react-app/contexts/AuthContext';
import Header from '@/react-app/components/Header';
import { Clock, CheckCircle, ChefHat } from 'lucide-react';

interface KitchenOrder {
  id: number;
  order_number: string;
  table_number?: string;
  room_number?: string;
  order_type: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    notes?: string;
    status: 'pending' | 'preparing' | 'ready';
    preparation_time: number;
  }[];
  total_time: number;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

const mockKitchenOrders: KitchenOrder[] = [
  {
    id: 1,
    order_number: 'ORD-001',
    table_number: 'T02',
    order_type: 'dine_in',
    items: [
      { id: 1, name: 'Ugali & Nyama Choma', quantity: 2, status: 'preparing', preparation_time: 25 },
      { id: 2, name: 'Pilau Rice', quantity: 1, status: 'pending', preparation_time: 30 },
    ],
    total_time: 30,
    priority: 'high',
    created_at: '2024-10-09T14:30:00Z'
  },
  {
    id: 2,
    order_number: 'ORD-002',
    room_number: '101',
    order_type: 'room_service',
    items: [
      { id: 3, name: 'Continental Breakfast', quantity: 1, status: 'ready', preparation_time: 15 },
      { id: 4, name: 'Kenyan Coffee', quantity: 2, status: 'ready', preparation_time: 5 },
    ],
    total_time: 15,
    priority: 'medium',
    created_at: '2024-10-09T14:15:00Z'
  },
  {
    id: 3,
    order_number: 'ORD-003',
    table_number: 'T05',
    order_type: 'dine_in',
    items: [
      { id: 5, name: 'Chicken Curry', quantity: 1, status: 'pending', preparation_time: 25 },
      { id: 6, name: 'Vegetable Stir Fry', quantity: 1, status: 'pending', preparation_time: 15 },
      { id: 7, name: 'Fresh Mango Juice', quantity: 2, status: 'ready', preparation_time: 5 },
    ],
    total_time: 25,
    priority: 'low',
    created_at: '2024-10-09T14:45:00Z'
  }
];

export default function KitchenDisplay() {
  const { } = useAuth();
  const [orders, setOrders] = useState<KitchenOrder[]>(mockKitchenOrders);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateItemStatus = (orderId: number, itemId: number, status: 'pending' | 'preparing' | 'ready') => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          )
        };
      }
      return order;
    }));
  };

  const markOrderComplete = (orderId: number) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
    // In real app, this would notify the POS system
    alert('Order marked as complete and sent to service staff');
  };

  const getElapsedTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const elapsed = Math.floor((currentTime.getTime() - created.getTime()) / 1000 / 60);
    return elapsed;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500 text-white';
      case 'preparing':
        return 'bg-yellow-500 text-white';
      case 'pending':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8 text-yellow-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kitchen Display System</h1>
                <p className="text-gray-600">Active orders and preparation status</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString('en-KE', { hour12: true })}
              </div>
              <div className="text-sm text-gray-600">
                {currentTime.toLocaleDateString('en-KE')}
              </div>
            </div>
          </div>
        </div>

        {/* Order Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-gray-600">Active Orders</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              {orders.filter(o => o.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.reduce((acc, order) => acc + order.items.filter(item => item.status === 'preparing').length, 0)}
            </div>
            <div className="text-sm text-gray-600">Items Preparing</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {orders.reduce((acc, order) => acc + order.items.filter(item => item.status === 'ready').length, 0)}
            </div>
            <div className="text-sm text-gray-600">Items Ready</div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => {
            const elapsed = getElapsedTime(order.created_at);
            const isOverdue = elapsed > order.total_time;
            const allItemsReady = order.items.every(item => item.status === 'ready');

            return (
              <div
                key={order.id}
                className={`
                  bg-white rounded-lg border-2 p-4 shadow-sm transition-all
                  ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  ${allItemsReady ? 'ring-2 ring-green-500' : ''}
                `}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.order_number}</h3>
                    <p className="text-sm text-gray-600">
                      {order.table_number ? `Table ${order.table_number}` : `Room ${order.room_number}`}
                      {' • '}
                      {order.order_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                      {order.priority.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-sm">
                      <Clock className="w-4 h-4" />
                      <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}>
                        {elapsed}m / {order.total_time}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm text-gray-500">x{item.quantity}</span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Est. {item.preparation_time} minutes
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => updateItemStatus(order.id, item.id, 'preparing')}
                            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-md transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {item.status === 'preparing' && (
                          <button
                            onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors"
                          >
                            Ready
                          </button>
                        )}
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Complete Order Button */}
                {allItemsReady && (
                  <button
                    onClick={() => markOrderComplete(order.id)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
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

import { useState, useEffect } from 'react';
import { apiClient } from '../../config/api';
import { timeAgo } from '../../pages/AdminDashboard'; // Reusing helper function

interface OrderItem {
  product_name: string;
  quantity: number;
  notes?: string;
}

interface Order {
  id: number;
  order_number: string;
  created_at: string;
  status: string;
  items: OrderItem[];
}

export default function KitchenOrderView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial orders
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get('/api/kitchen/orders');
        if (response.ok) {
          setOrders(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch kitchen orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    // Setup WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}/ws/kitchen`);

    ws.onopen = () => {
      console.log('Kitchen WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'new_order') {
        setOrders((prevOrders) => [message.order, ...prevOrders]);
      }
    };

    ws.onclose = () => {
      console.log('Kitchen WebSocket disconnected');
    };

    // Cleanup on component unmount
    return () => {
      ws.close();
    };
  }, []);

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
        await apiClient.put(`/api/kitchen/orders/${orderId}/status`, { status });
        setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
        console.error('Failed to update order status', error);
    }
  };


  if (isLoading) {
    return <div className="text-center p-8">Loading active orders...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">{order.order_number}</h3>
            <span className="text-xs text-gray-500">{timeAgo(order.created_at)}</span>
          </div>
          <div className="flex-1 space-y-2 mb-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                    <span className="font-semibold">{item.quantity}x</span> {item.product_name}
                    {item.notes && <p className="text-xs text-red-600 pl-4">- {item.notes}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <button 
                onClick={() => handleStatusChange(order.id, 'preparing')}
                disabled={order.status === 'preparing' || order.status === 'ready'}
                className={`w-full py-2 rounded-md text-sm font-semibold text-white ${order.status === 'preparing' || order.status === 'ready' ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
                Start Preparing
            </button>
            <button 
                onClick={() => handleStatusChange(order.id, 'ready')}
                disabled={order.status === 'ready'}
                className={`w-full py-2 rounded-md text-sm font-semibold text-white ${order.status === 'ready' ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
            >
                Mark as Ready
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
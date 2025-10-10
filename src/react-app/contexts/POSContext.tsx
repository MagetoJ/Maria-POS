import React, { createContext, useContext, useState } from 'react';

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  image_url?: string;
  preparation_time: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface Table {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  x_position: number;
  y_position: number;
}

export interface Room {
  id: number;
  room_number: string;
  room_type: string;
  status: 'vacant' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  guest_name?: string;
  check_in_date?: string;
  check_out_date?: string;
  rate: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface Order {
  location: string;
  delivery_address: null;
  id?: number;
  order_number?: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery' | 'room_service';
  table_id?: number;
  room_id?: number;
  customer_name?: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
}

interface POSContextType {
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  addItemToOrder: (product: Product, quantity?: number) => void;
  removeItemFromOrder: (itemId: number) => void;
  updateItemQuantity: (itemId: number, quantity: number) => void;
  clearOrder: () => void;
  calculateOrderTotals: (order: Order) => Order;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const calculateOrderTotals = (order: Order): Order => {
    const subtotal = order.items.reduce((sum, item) => sum + item.total_price, 0);
    const tax_amount = subtotal * 0.16; // 16% VAT in Kenya
    const service_charge = order.order_type === 'dine_in' ? subtotal * 0.10 : 0; // 10% service charge for dine-in
    const total_amount = subtotal + tax_amount + service_charge - order.discount_amount;

    return {
      ...order,
      subtotal,
      tax_amount,
      service_charge,
      total_amount
    };
  };

  const addItemToOrder = (product: Product, quantity: number = 1) => {
    const newItem: OrderItem = {
      id: Date.now(), // Temporary ID
      product_id: product.id,
      product,
      quantity,
      unit_price: product.price,
      total_price: product.price * quantity
    };

    if (!currentOrder) {
      const newOrder: Order = {
          order_type: 'dine_in',
          items: [newItem],
          subtotal: 0,
          tax_amount: 0,
          service_charge: 0,
          discount_amount: 0,
          total_amount: 0,
          location: '',
          delivery_address: null
      };
      setCurrentOrder(calculateOrderTotals(newOrder));
    } else {
      const existingItemIndex = currentOrder.items.findIndex(item => item.product_id === product.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...currentOrder.items];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].unit_price * updatedItems[existingItemIndex].quantity;
        
        const updatedOrder = { ...currentOrder, items: updatedItems };
        setCurrentOrder(calculateOrderTotals(updatedOrder));
      } else {
        const updatedOrder = { ...currentOrder, items: [...currentOrder.items, newItem] };
        setCurrentOrder(calculateOrderTotals(updatedOrder));
      }
    }
  };

  const removeItemFromOrder = (itemId: number) => {
    if (!currentOrder) return;
    
    const updatedItems = currentOrder.items.filter(item => item.id !== itemId);
    const updatedOrder = { ...currentOrder, items: updatedItems };
    
    if (updatedItems.length === 0) {
      setCurrentOrder(null);
    } else {
      setCurrentOrder(calculateOrderTotals(updatedOrder));
    }
  };

  const updateItemQuantity = (itemId: number, quantity: number) => {
    if (!currentOrder || quantity <= 0) return;
    
    const updatedItems = currentOrder.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total_price: item.unit_price * quantity
        };
      }
      return item;
    });
    
    const updatedOrder = { ...currentOrder, items: updatedItems };
    setCurrentOrder(calculateOrderTotals(updatedOrder));
  };

  const clearOrder = () => {
    setCurrentOrder(null);
  };

  return (
    <POSContext.Provider value={{
      currentOrder,
      setCurrentOrder,
      addItemToOrder,
      removeItemFromOrder,
      updateItemQuantity,
      clearOrder,
      calculateOrderTotals
    }}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};

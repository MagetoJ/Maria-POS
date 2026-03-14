import React, { createContext, useContext, useState } from 'react';

// --- INTERFACES (Ensure all are exported) ---
export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  image_url?: string;
  preparation_time: number;
  source?: 'kitchen' | 'bar';
  current_stock?: number;
  inventory_item_id?: number | null; // <-- ADDED
}

export interface Category {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Table {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
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
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  source?: 'kitchen' | 'bar';
  inventory_item_id?: number | null; // <-- ADDED
}

export interface Order {
  id?: string | number;
  order_number?: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery' | 'room_service' | 'bar_sale' | 'self_service';
  customer_name?: string;
  items: OrderItem[];
  table_id?: number;
  room_id?: number;
  location_detail?: string; // <-- **CHANGED/ADDED LINE**
}

interface POSContextType {
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  addItemToOrder: (
    product: Product, 
    quantity?: number, 
    orderType?: Order['order_type'],
    roomId?: number | string
  ) => void;
  removeItemFromOrder: (itemId: number) => void;
  updateItemQuantity: (itemId: number, newQuantity: number) => void;
  clearOrder: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// --- PROVIDER (Ensure it is exported) ---
export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const addItemToOrder = (
    product: Product, 
    quantity: number = 1, 
    orderType: Order['order_type'] = 'dine_in',
    roomId?: number | string
  ) => {
    const newItem: OrderItem = {
      id: Date.now(),
      product_id: product.id,
      name: product.name,
      quantity,
      price: product.price,
      source: product.source || 'kitchen',
      inventory_item_id: product.inventory_item_id, // <-- ADDED
    };

    if (!currentOrder) {
      const newOrder: Order = {
        id: `temp-${Date.now()}`,
        order_type: orderType,
        items: [newItem],
        room_id: roomId ? Number(roomId) : undefined
      };
      setCurrentOrder(newOrder);
    } else {
      const existingItem = currentOrder.items.find(item => item.product_id === product.id && item.source === product.source);
      let updatedItems;
      if (existingItem) {
        updatedItems = currentOrder.items.map(item =>
          item.product_id === product.id && item.source === product.source
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updatedItems = [...currentOrder.items, newItem];
      }
      
      const updatedOrder: Order = { 
        ...currentOrder, 
        items: updatedItems,
        order_type: orderType || currentOrder.order_type,
        room_id: roomId ? Number(roomId) : (currentOrder.room_id)
      };
      setCurrentOrder(updatedOrder);
    }
  };

  const removeItemFromOrder = (itemId: number) => {
    if (!currentOrder) return;
    const updatedItems = currentOrder.items.filter(item => item.id !== itemId);
    if (updatedItems.length === 0) {
      clearOrder();
    } else {
      setCurrentOrder({ ...currentOrder, items: updatedItems });
    }
  };

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (!currentOrder) return;
    if (newQuantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }
    const updatedItems = currentOrder.items.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCurrentOrder({ ...currentOrder, items: updatedItems });
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
    }}>
      {children}
    </POSContext.Provider>
  );
};

// --- HOOK (Ensure it is exported) ---
export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
import React, { createContext, useContext, useState } from 'react';
import { apiClient } from '../config/api';

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
  is_stock_deducted?: boolean; // <-- NEW: Track if stock was already deducted
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
  ) => Promise<void>;
  removeItemFromOrder: (itemId: number) => Promise<void>;
  updateItemQuantity: (itemId: number, newQuantity: number) => Promise<void>;
  clearOrder: (shouldRestoreStock?: boolean) => Promise<void>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// --- PROVIDER (Ensure it is exported) ---
export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const addItemToOrder = async (
    product: Product, 
    quantity: number = 1, 
    orderType: Order['order_type'] = 'dine_in',
    roomId?: number | string
  ) => {
    // If it's a bar product and we are in Quick POS / Bar sale, deduct stock immediately
    let stockDeducted = false;
    const invId = product.inventory_item_id || (product.source === 'bar' ? product.id : null);
    
    if (invId && product.source === 'bar') {
      try {
        const response = await apiClient.post('/api/quick-pos/deduct-stock-immediate', {
          inventory_item_id: invId,
          quantity: quantity
        });
        
        if (response.ok) {
          const resData = await response.json();
          stockDeducted = true;
          console.log(`✅ Immediate stock deduction successful for ${product.name}`);
          // Notify other components that stock has changed
          window.dispatchEvent(new CustomEvent('inventory-updated', { 
            detail: { 
              inventory_item_id: invId, 
              new_stock: resData.new_stock 
            } 
          }));
        } else {
          const err = await response.json();
          alert(`Stock Error: ${err.message || 'Could not deduct stock'}`);
          return; // Stop if deduction fails
        }
      } catch (err) {
        console.error('Failed to deduct stock immediately:', err);
        alert('Network error while deducting stock. Please try again.');
        return;
      }
    }

    const newItem: OrderItem = {
      id: Date.now(),
      product_id: product.id,
      name: product.name,
      quantity,
      price: product.price,
      source: product.source || 'kitchen',
      inventory_item_id: invId,
      is_stock_deducted: stockDeducted, // Track that we already deducted it
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

  const removeItemFromOrder = async (itemId: number) => {
    if (!currentOrder) return;
    
    const item = currentOrder.items.find(i => i.id === itemId);
    if (item && item.source === 'bar' && item.inventory_item_id && item.is_stock_deducted) {
      // Restore stock
      try {
        const response = await apiClient.post('/api/quick-pos/restore-stock-immediate', {
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity
        });
        const resData = await response.json();
        window.dispatchEvent(new CustomEvent('inventory-updated', { 
          detail: { 
            inventory_item_id: item.inventory_item_id, 
            new_stock: resData.new_stock 
          } 
        }));
      } catch (err) {
        console.error('Failed to restore stock:', err);
      }
    }

    const updatedItems = currentOrder.items.filter(item => item.id !== itemId);
    if (updatedItems.length === 0) {
      clearOrder(false);
    } else {
      setCurrentOrder({ ...currentOrder, items: updatedItems });
    }
  };

  const updateItemQuantity = async (itemId: number, newQuantity: number) => {
    if (!currentOrder) return;
    
    const item = currentOrder.items.find(i => i.id === itemId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }

    // If it's a bar item, handle stock difference
    if (item.source === 'bar' && item.inventory_item_id) {
      const diff = newQuantity - item.quantity;
      if (diff > 0) {
        // Deduct more
        try {
          const response = await apiClient.post('/api/quick-pos/deduct-stock-immediate', {
            inventory_item_id: item.inventory_item_id,
            quantity: diff
          });
          if (!response.ok) {
            const err = await response.json();
            alert(`Stock Error: ${err.message || 'Could not deduct stock'}`);
            return;
          }
          const resData = await response.json();
          window.dispatchEvent(new CustomEvent('inventory-updated', { 
            detail: { 
              inventory_item_id: item.inventory_item_id, 
              new_stock: resData.new_stock 
            } 
          }));
        } catch (err) {
          console.error('Failed to deduct stock:', err);
          return;
        }
      } else if (diff < 0) {
        // Restore stock
        try {
          const response = await apiClient.post('/api/quick-pos/restore-stock-immediate', {
            inventory_item_id: item.inventory_item_id,
            quantity: Math.abs(diff)
          });
          const resData = await response.json();
          window.dispatchEvent(new CustomEvent('inventory-updated', { 
            detail: { 
              inventory_item_id: item.inventory_item_id, 
              new_stock: resData.new_stock 
            } 
          }));
        } catch (err) {
          console.error('Failed to restore stock:', err);
        }
      }
    }

    const updatedItems = currentOrder.items.map(i =>
      i.id === itemId ? { ...i, quantity: newQuantity } : i
    );
    setCurrentOrder({ ...currentOrder, items: updatedItems });
  };

  const clearOrder = async (shouldRestoreStock: boolean = true) => {
    // Restore stock for all bar items in the cart if requested
    if (shouldRestoreStock && currentOrder && currentOrder.items.length > 0) {
      for (const item of currentOrder.items) {
        if (item.source === 'bar' && item.inventory_item_id && item.is_stock_deducted) {
          try {
            const response = await apiClient.post('/api/quick-pos/restore-stock-immediate', {
              inventory_item_id: item.inventory_item_id,
              quantity: item.quantity
            });
            const resData = await response.json();
            window.dispatchEvent(new CustomEvent('inventory-updated', { 
              detail: { 
                inventory_item_id: item.inventory_item_id, 
                new_stock: resData.new_stock 
              } 
            }));
          } catch (err) {
            console.error('Failed to restore stock on clear:', err);
          }
        }
      }
    }
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
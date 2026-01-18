import { Request, Response } from 'express';
import db from '../db';
import { validateStaffPinForOrder } from '../utils/validation';
import { WebSocketService } from '../services/websocket';

let webSocketService: WebSocketService;

export const setWebSocketService = (wsService: WebSocketService) => {
  webSocketService = wsService;
};

// Create new order with PIN validation
export const createOrder = async (req: Request, res: Response) => {
  const { items, staff_username, pin, payment_method = 'cash', ...orderData } = req.body;

  try {
    let staffId = null;
    let staffName = 'Quick POS';

    // Skip PIN validation for bar sales AND self-service (QR) orders
    if (orderData.order_type === 'bar_sale' || orderData.order_type === 'self_service') {
      staffName = orderData.order_type === 'self_service' ? 'Customer (QR)' : 'Bar Staff';
      console.log(`${orderData.order_type} order - no PIN validation required`);
    } else {
      // Validate staff username and PIN for other orders
      if (!staff_username || !pin) {
        return res.status(400).json({ message: 'Staff username and PIN are required' });
      }

      const validation = await validateStaffPinForOrder(staff_username, pin);
      if (!validation.valid || !validation.staffId || !validation.staffName) {
        return res.status(401).json({ message: 'Invalid username or PIN' });
      }

      staffId = validation.staffId;
      staffName = validation.staffName;
      console.log('PIN validated for order by:', staffName);
    }

    // 1. Generate order number outside to keep it in scope
    const orderNumber = `ORD-${Date.now()}`;

    let orderId: any;

    // Start DB transaction
    await db.transaction(async trx => {
      // Remove client-sent `id`
      const { id, ...orderToInsert } = orderData;

      // Ensure numeric fields and add order_number
      const safeOrder = {
        ...orderToInsert,
        staff_id: staffId,
        order_number: orderNumber, // Use the variable from outer scope
        subtotal: Number(orderToInsert.subtotal || 0),
        total_amount: Number(orderToInsert.total_amount || 0),
        payment_method: payment_method || 'cash',
        // Set initial status for self-service orders to 'pending' (kitchen needs to accept/see it)
        status: orderData.order_type === 'self_service' ? 'pending' : (orderToInsert.status || 'pending'), 
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log('Inserting order:', safeOrder);

      // Insert order and get auto-generated ID
      const [insertedOrder] = await trx('orders')
        .insert(safeOrder)
        .returning('id');

      orderId = insertedOrder.id;

      if (!orderId) throw new Error('Failed to create order and get ID');

      // Insert order items and handle bar item inventory deduction
      if (items && items.length > 0) {
        // Check which items are bar items (inventory items with type 'bar')
        const barItemIds = new Set<number>();
        for (const item of items) {
          // Check inventory for ALL items if it's a self-service order to prevent ordering out-of-stock items
          // Or just stick to BAR items logic for now to stay consistent with existing logic
          const inventoryItem = await trx('inventory_items')
            .where({ id: item.product_id, is_active: true })
            .first();
          
          if (inventoryItem) {
             // Logic for BAR items or generally tracking stock
             if (inventoryItem.inventory_type === 'bar') {
                barItemIds.add(item.product_id);
                const newStock = inventoryItem.current_stock - Number(item.quantity);
                if (newStock < 0) {
                  throw new Error(`Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.current_stock}`);
                }
                await trx('inventory_items')
                  .where({ id: item.product_id })
                  .update({ current_stock: newStock, updated_at: new Date() });
             }
          }
        }

        const orderItems = items.map((item: any) => ({
          order_id: orderId,
          product_id: item.product_id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
          notes: item.notes,
        }));

        await trx('order_items').insert(orderItems);
      }

      // Create payment record
      if (payment_method) {
        await trx('payments').insert({
          order_id: orderId,
          payment_method: payment_method,
          amount: Number(orderToInsert.total_amount || 0),
          status: 'pending' // Payments for QR orders might be pending initially
        });
      }
    });

    // Broadcast to kitchen
    if (webSocketService) {
      webSocketService.broadcastToKitchens({ type: 'new_order' });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order_id: orderId,
      order_number: orderNumber,
      staff_name: staffName,
    });

  } catch (err) {
    console.error('Order creation error:', err);
    console.error('Error details:', {
      message: (err as Error).message,
      stack: (err as Error).stack,
      name: (err as Error).name
    });
    res.status(500).json({ 
      message: 'Failed to create order',
      error: (err as Error).message 
    });
  }
};

// Get orders with filtering
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      order_type, 
      start_date, 
      end_date,
      limit = 50,
      offset = 0 
    } = req.query;

    let query = db('orders')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Apply filters
    if (status) {
      query = query.where('status', status);
    }
    
    if (order_type) {
      query = query.where('order_type', order_type);
    }
    
    if (start_date && end_date) {
      query = query.whereBetween('created_at', [start_date, end_date]);
    }

    const orders = await query;

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.id);

    // Get all order items in one query
    const allItems = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .whereIn('order_id', orderIds)
      .select(
        'order_items.*',
        'products.name as product_name'
      );

    // Group items by order_id
    const itemsByOrder = allItems.reduce((acc: any, item: any) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }
      acc[item.order_id].push(item);
      return acc;
    }, {});

    // Attach items to orders
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: itemsByOrder[order.id] || []
    }));

    res.json(ordersWithItems);

  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await db('orders').where({ id }).first();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get order items
    order.items = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .where('order_id', id)
      .select(
        'order_items.*',
        'products.name as product_name'
      );

    res.json(order);

  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Error fetching order' });
  }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [updatedOrder] = await db('orders')
      .where({ id })
      .update({ 
        status, 
        updated_at: new Date() 
      })
      .returning('*');

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Broadcast status update to kitchen displays
    if (webSocketService) {
      webSocketService.broadcastToKitchens({
        type: 'order_status_update',
        orderId: id,
        status: status,
        order: updatedOrder
      });
    }

    res.json(updatedOrder);

  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Error updating order status' });
  }
};

// Mark order as completed when receipt is printed
export const markOrderAsCompleted = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await db('orders').where({ id }).first();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [updatedOrder] = await db('orders')
      .where({ id })
      .update({ 
        status: 'completed', 
        updated_at: new Date() 
      })
      .returning('*');

    console.log(`✅ Order ${id} marked as completed for receipt printing`);
    res.json({ message: 'Order marked as completed', order: updatedOrder });

  } catch (err) {
    console.error('Error marking order as completed:', err);
    res.status(500).json({ message: 'Error marking order as completed' });
  }
};

// Get staff member's recent orders (for My Recent Orders feature)
export const getStaffRecentOrders = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) {
      return res.status(401).json({ message: 'Unauthorized - No staff ID' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const orders = await db('orders')
      .where('staff_id', staffId)
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.id);

    // Get order items in one query
    const allItems = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .whereIn('order_id', orderIds)
      .select(
        'order_items.*',
        'products.name as product_name'
      );

    // Get payment details in one query
    const allPayments = await db('payments')
      .whereIn('order_id', orderIds);

    // Group items and payments
    const itemsByOrder = allItems.reduce((acc: any, item: any) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const paymentsByOrder = allPayments.reduce((acc: any, payment: any) => {
      acc[payment.order_id] = payment;
      return acc;
    }, {});

    // Attach to orders
    const ordersWithDetails = orders.map(order => ({
      ...order,
      items: itemsByOrder[order.id] || [],
      payment_method: paymentsByOrder[order.id]?.payment_method || order.payment_method || 'cash'
    }));

    res.json(ordersWithDetails);

  } catch (err) {
    console.error('Error fetching staff recent orders:', err);
    res.status(500).json({ message: 'Error fetching recent orders' });
  }
};

// Get ALL recent orders (for Receptionist/Admin view - no staff_id filter)
export const getAllRecentOrders = async (req: Request, res: Response) => {
  try {
    // Only allow authorized roles
    const authorizedRoles = ['admin', 'manager', 'receptionist', 'cashier'];
    if (!req.user || !authorizedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access to all orders' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const orders = await db('orders')
      .select('orders.*', 'staff.name as staff_name')
      .leftJoin('staff', 'orders.staff_id', 'staff.id')
      .orderBy('orders.created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.id);

    // Get order items in one query
    const allItems = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .whereIn('order_id', orderIds)
      .select(
        'order_items.*',
        'products.name as product_name'
      );

    // Get payments in one query
    const allPayments = await db('payments')
      .whereIn('order_id', orderIds);

    // Group items and payments
    const itemsByOrder = allItems.reduce((acc: any, item: any) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const paymentsByOrder = allPayments.reduce((acc: any, payment: any) => {
      acc[payment.order_id] = payment;
      return acc;
    }, {});

    // Attach to orders
    const ordersWithDetails = orders.map(order => ({
      ...order,
      items: itemsByOrder[order.id] || [],
      payment_method: paymentsByOrder[order.id]?.payment_method || order.payment_method || 'cash'
    }));

    res.json(ordersWithDetails);

  } catch (err) {
    console.error('Error fetching all recent orders:', err);
    res.status(500).json({ message: 'Error fetching recent orders' });
  }
};

// Validate staff PIN for order
export const validatePin = async (req: Request, res: Response) => {
  try {
    const { username, pin } = req.body;
    
    if (!username || !pin) {
      return res.status(400).json({ message: 'Username and PIN are required' });
    }
    
    const validation = await validateStaffPinForOrder(username, pin);
    if (!validation.valid) {
      return res.status(401).json({ message: 'Invalid username or PIN' });
    }

    const user = await db('staff').where({ username }).first();
    const { password: _, pin: __, ...userWithoutSensitiveData } = user;
    
    res.json(userWithoutSensitiveData);

  } catch (err) {
    console.error('Error validating PIN:', err);
    res.status(500).json({ message: 'Error validating PIN' });
  }
};

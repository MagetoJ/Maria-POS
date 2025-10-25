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
  const { items, staff_username, pin, ...orderData } = req.body;

  try {
    // Validate staff username and PIN
    if (!staff_username || !pin) {
      return res.status(400).json({ message: 'Staff username and PIN are required' });
    }

    const validation = await validateStaffPinForOrder(staff_username, pin);
    if (!validation.valid || !validation.staffId) {
      return res.status(401).json({ message: 'Invalid username or PIN' });
    }

    console.log('PIN validated for order by:', validation.staffName);

    // Function to generate a unique order_number
    const generateOrderNumber = () => `ORD-${Date.now()}`;

    // Start DB transaction
    await db.transaction(async trx => {
      // Remove client-sent `id`
      const { id, ...orderToInsert } = orderData;

      // Ensure numeric fields and add order_number
      const safeOrder = {
        ...orderToInsert,
        staff_id: validation.staffId,
        order_number: generateOrderNumber(),
        subtotal: Number(orderToInsert.subtotal || 0),
        total_amount: Number(orderToInsert.total_amount || 0),
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log('Inserting order:', safeOrder);

      // Insert order and get auto-generated ID
      const [{ id: orderId }] = await trx('orders')
        .insert(safeOrder)
        .returning('id');

      if (!orderId) throw new Error('Failed to create order and get ID');

      // Insert order items
      if (items && items.length > 0) {
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
    });

    // Broadcast to kitchen
    if (webSocketService) {
      webSocketService.broadcastToKitchens({ type: 'new_order' });
    }

    res.status(201).json({
      message: 'Order created successfully',
      staff_name: validation.staffName,
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

    // Get order items for each order
    for (const order of orders) {
      (order as any).items = await db('order_items')
        .leftJoin('products', 'order_items.product_id', 'products.id')
        .where('order_id', order.id)
        .select(
          'order_items.*',
          'products.name as product_name'
        );
    }

    res.json(orders);

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
    console.error('PIN validation error:', err);
    res.status(500).json({ message: 'Server error during PIN validation' });
  }
};
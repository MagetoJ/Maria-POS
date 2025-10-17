import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import http, { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { authenticateToken, authorizeRoles } from './middleware/auth';
import path from 'path';
import dotenv from 'dotenv';
import db from './db'; // <-- your PostgreSQL connection file
import nodemailer from 'nodemailer';

// --- Initialization ---
dotenv.config();
const app = express();
const server = http.createServer(app);
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-and-secure-key-that-you-should-change';

// --- Email Configuration ---
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // For development only
  }
});

// Generate 6-digit numeric code
const generateResetCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send password reset email
const sendResetEmail = async (email: string, code: string, name: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Maria Havens POS <noreply@mariahavens.com>',
      to: email,
      subject: 'Password Reset Code - Maria Havens POS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f59e0b; margin: 0;">Maria Havens POS</h1>
            <p style="color: #666; margin: 5px 0;">Point of Sale System</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #555;">Hello ${name},</p>
            <p style="color: #555;">You requested a password reset for your Maria Havens POS account.</p>
            <p style="color: #555;">Your password reset code is:</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #f59e0b; background-color: #fff; padding: 15px 20px; border-radius: 8px; border: 2px solid #f59e0b; letter-spacing: 3px;">${code}</span>
            </div>
            
            <p style="color: #555;">This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #555;">If you didn't request this reset, please ignore this email.</p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 14px;">
            <p>© 2024 Maria Havens POS System</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// --- CORS Configuration ---
app.use(cors({
  origin: [
    'https://mariahavensfrontend.onrender.com',
    'https://mariahavensbackend.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    /\.onrender\.com$/
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

// --- Serve Static Frontend Files ---
// IMPORTANT: This serves your built frontend files
// In production, __dirname is /opt/render/project/server/dist
// So we need to go up to project root and then to dist/client
const clientBuildPath = path.resolve(__dirname, '../../dist/client');
console.log('📁 Serving static files from:', clientBuildPath);

// Serve static files with proper caching headers for mobile
app.use(express.static(clientBuildPath, {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set cache headers for different file types
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.ico')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for images
    }
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for JS/CSS
    }
    if (path.endsWith('.webmanifest') || path.endsWith('.json')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for manifest
    }
  }
}));

// Serve public files (including images) from public directory for development
const publicPath = path.resolve(__dirname, '../../public');
console.log('📁 Serving public files from:', publicPath);

// In development, serve public assets directly
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(publicPath, {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
      // Set proper CORS headers for PWA assets
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.ico')) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Type', path.endsWith('.ico') ? 'image/x-icon' : 'image/png');
      }
    }
  }));
}

// --- Helper Function for PIN Validation ---
async function validateStaffPinForOrder(username: string, pin: string): Promise<{ valid: boolean; staffId?: number; staffName?: string }> {
  try {
    const user = await db('staff')
      .where({ username, is_active: true })
      .first();
    
    if (!user) return { valid: false };
    
    const userPin = user.pin?.toString();
    const providedPin = pin?.toString();
    
    if (userPin === providedPin) return { valid: true, staffId: user.id, staffName: user.name };
    
    return { valid: false };
  } catch (error) {
    console.error('PIN validation error:', error);
    return { valid: false };
  }
}

// --- WebSocket Setup ---
const wss = new WebSocketServer({ server });
const kitchenSockets = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    if (req.url === '/ws/kitchen') {
        console.log('Kitchen display connected');
        kitchenSockets.add(ws);
        ws.on('close', () => {
            console.log('Kitchen display disconnected');
            kitchenSockets.delete(ws);
        });
        ws.on('error', console.error);
    } else {
        ws.close();
    }
});

function broadcastToKitchens(message: object) {
    const data = JSON.stringify(message);
    kitchenSockets.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(data);
    });
}
app.get('/api/inventory', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userRole = req.user?.role;
        let query = db('inventory_items').select('*').orderBy('name', 'asc');

        if (!userRole) {
            return res.status(403).json({ message: 'User role not found' });
        }

        if (userRole === 'kitchen_staff') {
            query.where('inventory_type', 'kitchen');
        } else if (userRole === 'receptionist') {
            query.whereIn('inventory_type', ['bar', 'housekeeping', 'minibar']);
        } else if (userRole !== 'admin' && userRole !== 'manager') {
            return res.json([]); // Return empty for other non-privileged roles
        }
        
        const inventory = await query;
        res.json(inventory);

    } catch (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).json({ message: 'Error fetching inventory', error: (err as Error).message });
    }
});

// MODIFIED FOR ROLE-BASED STOCK UPDATES
app.put('/api/inventory/:id/stock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { current_stock } = req.body;
    const userRole = req.user?.role;

    if (current_stock === undefined) {
      return res.status(400).json({ message: 'Current stock value is required' });
    }

    const inventoryItem = await db('inventory_items').where({ id }).first();
    
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const isAdminOrManager = ['admin', 'manager'].includes(userRole!);
    const isKitchenStaff = userRole === 'kitchen_staff' && inventoryItem.inventory_type === 'kitchen';
    const isReceptionist = userRole === 'receptionist' && ['bar', 'housekeeping', 'minibar'].includes(inventoryItem.inventory_type);

    if (!isAdminOrManager && !isKitchenStaff && !isReceptionist) {
      return res.status(403).json({ 
        message: `You do not have permission to update ${inventoryItem.inventory_type} items.` 
      });
    }

    const [updatedItem] = await db('inventory_items')
      .where({ id })
      .update({ current_stock, updated_at: new Date() })
      .returning('*');

    res.json(updatedItem);
  } catch (err) {
    console.error('Inventory stock update error:', err);
    res.status(500).json({ message: 'Error updating inventory stock' });
  }
});


// --- KITCHEN-SPECIFIC ENDPOINTS ---
app.get('/api/kitchen/orders', authenticateToken, authorizeRoles('kitchen_staff', 'admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const activeOrders = await db('orders')
            .whereIn('status', ['pending', 'preparing'])
            .orderBy('created_at', 'asc');

        for (const order of activeOrders) {
            (order as any).items = await db('order_items')
                .join('products', 'order_items.product_id', 'products.id')
                .where('order_id', order.id)
                .select('order_items.quantity', 'products.name as product_name', 'order_items.notes');
        }
        res.json(activeOrders);
    } catch (err) {
        console.error('Error fetching kitchen orders:', err);
        res.status(500).json({ message: 'Error fetching kitchen orders' });
    }
});

app.put('/api/kitchen/orders/:id/status', authenticateToken, authorizeRoles('kitchen_staff', 'admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const [updatedOrder] = await db('orders').where({ id }).update({ status }).returning('*');
        res.json(updatedOrder);
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ message: 'Error updating order status' });
    }
});


// --- RECEPTIONIST-SPECIFIC ENDPOINTS ---
app.post('/api/receptionist/sell-item', authenticateToken, authorizeRoles('receptionist', 'admin', 'manager'), async (req: Request, res: Response) => {
  const { inventory_item_id, quantity, unit_price, payment_method } = req.body;
  const staff_id = req.user?.id;

  if (!inventory_item_id || !quantity || !unit_price || !payment_method) {
    return res.status(400).json({ message: 'Item ID, quantity, price, and payment method are required.' });
  }

  try {
    const item = await db('inventory_items').where({ id: inventory_item_id, inventory_type: 'bar' }).first();
    if (!item) return res.status(404).json({ message: 'Bar inventory item not found.' });
    if (item.current_stock < quantity) return res.status(400).json({ message: 'Not enough stock.' });

    const newStock = item.current_stock - quantity;
    const total_amount = quantity * unit_price;

    await db.transaction(async (trx) => {
      await trx('inventory_items').where({ id: inventory_item_id }).update({ current_stock: newStock });
      const [order] = await trx('orders').insert({
        order_number: `BAR-${Date.now()}`,
        order_type: 'bar_sale',
        status: 'completed',
        staff_id,
        total_amount,
        payment_status: 'paid',
        payment_method,
      }).returning('id');
      await trx('order_items').insert({
        order_id: order.id,
        product_name_manual: item.name, 
        quantity,
        unit_price,
        total_price: total_amount,
      });
    });
    res.status(200).json({ message: 'Sale completed successfully.', new_stock: newStock });
  } catch (err) {
    console.error('Bar sale error:', err);
    res.status(500).json({ message: 'Failed to process bar sale.' });
  }
});


// --- ROOM AND TABLE MANAGEMENT ---
app.get('/api/rooms', authenticateToken, async (req: Request, res: Response) => {
    try {
        const rooms = await db('rooms').select('*').orderBy('room_number', 'asc');
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});

app.put('/api/rooms/:id', authenticateToken, authorizeRoles('admin', 'manager', 'receptionist', 'housekeeping'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updatedRoom] = await db('rooms').where({ id }).update(req.body).returning('*');
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).json({ message: 'Error updating room' });
    }
});

app.post('/api/rooms/:roomId/check-in', authenticateToken, authorizeRoles('receptionist', 'admin', 'manager'), async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { guest_name, guest_contact } = req.body;
  const staff_id = req.user!.id;
  if (!guest_name) return res.status(400).json({ message: 'Guest name is required.' });
  try {
    await db.transaction(async (trx) => {
      const [room] = await trx('rooms').where({ id: roomId, status: 'vacant' }).update({ status: 'occupied' }).returning('*');
      if (!room) throw new Error('Room is not vacant or available for check-in.');
      await trx('room_transactions').insert({ room_id: roomId, staff_id, guest_name, guest_contact, status: 'active' });
      res.json(room);
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message || 'Failed to check-in guest.' });
  }
});

app.post('/api/rooms/:roomId/check-out', authenticateToken, authorizeRoles('receptionist', 'admin', 'manager'), async (req: Request, res: Response) => {
  const { roomId } = req.params;
  try {
    await db.transaction(async (trx) => {
      const [room] = await trx('rooms').where({ id: roomId, status: 'occupied' }).update({ status: 'cleaning' }).returning('*');
      if (!room) throw new Error('Room is not occupied or does not exist.');
      await trx('room_transactions').where({ room_id: roomId, status: 'active' }).update({ status: 'completed', check_out_time: new Date() });
      res.json(room);
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message || 'Failed to check-out guest.' });
  }
});

app.get('/api/tables', authenticateToken, async (req: Request, res: Response) => {
    try {
        const tables = await db('tables').select('*').orderBy('table_number', 'asc');
        res.json(tables);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tables' });
    }
});

app.post('/api/tables', authenticateToken, authorizeRoles('receptionist', 'admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const [newTable] = await db('tables').insert(req.body).returning('*');
        res.status(201).json(newTable);
    } catch (err) {
        res.status(500).json({ message: 'Error adding table' });
    }
});

app.put('/api/tables/:id', authenticateToken, authorizeRoles('waiter', 'receptionist', 'admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updatedTable] = await db('tables').where({ id }).update(req.body).returning('*');
        res.json(updatedTable);
    } catch (err) {
        res.status(500).json({ message: 'Error updating table' });
    }
});
// --- PUBLIC API Endpoints ---
app.get('/health', (req: Request, res: Response) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });
    
    const user = await db('staff').where({ username, is_active: true }).first();
    if (user && user.password === password) {
      const { password: _, pin: __, ...userWithoutSensitiveData } = user;
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ user: userWithoutSensitiveData, token });
    } else res.status(401).json({ message: 'Invalid username or password' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.post('/api/validate-pin', async (req: Request, res: Response) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) return res.status(400).json({ message: 'Username and PIN are required' });
    
    const validation = await validateStaffPinForOrder(username, pin);
    if (!validation.valid) return res.status(401).json({ message: 'Invalid username or PIN' });

    const user = await db('staff').where({ username }).first();
    const { password: _, pin: __, ...userWithoutSensitiveData } = user;
    res.json(userWithoutSensitiveData);
  } catch (err) {
    console.error('PIN validation error:', err);
    res.status(500).json({ message: 'Server error during PIN validation' });
  }
});

// --- PROTECTED API Endpoints ---

// Staff Management
app.get('/api/staff', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const staff = await db('staff').select('id', 'employee_id', 'username', 'name', 'role', 'pin', 'is_active', 'created_at');
    res.json(staff);
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ message: 'Error fetching staff' });
  }
});

app.post('/api/staff', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const [newStaff] = await db('staff').insert(req.body).returning('*');
    res.status(201).json(newStaff);
  } catch (err) {
    console.error('Error adding staff member:', err);
    res.status(500).json({ message: 'Error adding staff member', error: (err as Error).message });
  }
});

app.put('/api/staff/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [updatedStaff] = await db('staff').where({ id }).update(req.body).returning('*');
    res.json(updatedStaff);
  } catch (err) {
    console.error('Error updating staff member:', err);
    res.status(500).json({ message: 'Error updating staff member' });
  }
});

app.delete('/api/staff/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db('staff').where({ id }).del();
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting staff member:', err);
    res.status(500).json({ message: 'Error deleting staff member' });
  }
});

// Dashboard Overview Stats
app.get('/api/dashboard/overview-stats', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todaysOrders = await db('orders').where('created_at', '>=', today).select('*');
    const todaysRevenue = todaysOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const ordersToday = todaysOrders.length;
    const activeStaff = await db('staff').where({ is_active: true }).count('* as count').first();
    const lowStock = await db('inventory_items').whereRaw('current_stock <= minimum_stock').count('* as count').first();
    const recentOrders = await db('orders')
      .orderBy('created_at', 'desc')
      .limit(5)
      .select('id', 'order_number', 'order_type', 'table_id', 'room_id', 'total_amount', 'created_at')
      .then(orders => orders.map(order => ({
        ...order,
        location: order.order_type === 'table' ? `Table ${order.table_id}` : order.order_type === 'room' ? `Room ${order.room_id}` : order.order_type
      })));
    
    res.json({
      todaysRevenue,
      ordersToday,
      activeStaff: (activeStaff as any)?.count || 0,
      lowStockItems: (lowStock as any)?.count || 0,
      recentOrders: recentOrders || []
    });
  } catch (err) {
    console.error('Error fetching overview stats:', err);
    res.status(500).json({ message: 'Error fetching overview stats' });
  }
});

// Order Management - ENHANCED WITH PIN VALIDATION
// Get list of waiters for Quick POS (PUBLIC endpoint - no auth required)
app.get('/api/waiters', async (req: Request, res: Response) => {
  try {
    const waiters = await db('staff')
      .where({ role: 'waiter', is_active: true })
      .select('id', 'employee_id', 'username', 'name')
      .orderBy('name', 'asc');
    
    res.json(waiters);
  } catch (err) {
    console.error('Error fetching waiters:', err);
    res.status(500).json({ message: 'Error fetching waiters' });
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
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
        tax_amount: Number(orderToInsert.tax_amount || 0),
        total_amount: Number(orderToInsert.total_amount || 0),
      };

      console.log('Inserting order:', safeOrder);

      // Insert order and get auto-generated ID
      const [{ id: orderId }] = await trx('orders')
        .insert(safeOrder)
        .returning('id');

      if (!orderId) throw new Error('Failed to create order and get ID');

      // Insert order items
      const orderItems = items.map((item: any) => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
        notes: item.notes,
      }));

      if (orderItems.length > 0) await trx('order_items').insert(orderItems);
    });

    // Broadcast to kitchen
    broadcastToKitchens({ type: 'new_order' });

    res.status(201).json({
      message: 'Order created successfully',
      staff_name: validation.staffName,
    });

  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

app.post('/api/attendance/clock-out', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: staffId } = req.user!;

    const activeLog = await db('attendance_log')
      .where({ staff_id: staffId })
      .whereIn('status', ['clocked_in', 'on_break'])
      .orderBy('clock_in', 'desc')
      .first();

    if (!activeLog) {
      return res.status(400).json({ message: 'No active clock-in found' });
    }

    const clockOut = new Date();
    const clockIn = new Date(activeLog.clock_in);
    const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    const [updated] = await db('attendance_log')
      .where({ id: activeLog.id })
      .update({
        clock_out: clockOut.toISOString(),
        total_hours: totalHours.toFixed(2),
        status: 'clocked_out'
      })
      .returning('*');

    // Update shift if associated
    if (activeLog.shift_id) {
      await db('shifts')
        .where({ id: activeLog.shift_id })
        .update({
          actual_end_time: clockOut.toISOString(),
          status: 'completed'
        });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error clocking out:', err);
    res.status(500).json({ message: 'Error clocking out' });
  }
});

// Shifts Management Endpoints
app.get('/api/shifts/my-shifts', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { start_date, end_date } = req.query;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const shifts = await db('shifts')
            .where({ staff_id: userId })
            .whereBetween('shift_date', [start_date as string, end_date as string])
            .orderBy('shift_date', 'asc')
            .orderBy('start_time', 'asc');

        res.json(shifts);
    } catch (err) {
        console.error('Error fetching shifts:', err);
        res.status(500).json({ message: 'Error fetching shifts', error: (err as Error).message });
    }
});

app.get('/api/shifts', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { start_date, end_date } = req.query;
        
        let query = db('shifts')
            .join('staff', 'shifts.staff_id', 'staff.id')
            .select('shifts.*', 'staff.name as staff_name', 'staff.role as staff_role');

        if (start_date && end_date) {
            query = query.whereBetween('shift_date', [start_date as string, end_date as string]);
        }

        const shifts = await query.orderBy('shift_date', 'asc').orderBy('start_time', 'asc');
        res.json(shifts);
    } catch (err) {
        console.error('Error fetching shifts:', err);
        res.status(500).json({ message: 'Error fetching shifts', error: (err as Error).message });
    }
});

app.post('/api/shifts', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const [newShift] = await db('shifts').insert(req.body).returning('*');
        res.status(201).json(newShift);
    } catch (err) {
        console.error('Error creating shift:', err);
        res.status(500).json({ message: 'Error creating shift', error: (err as Error).message });
    }
});

app.put('/api/shifts/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updatedShift] = await db('shifts').where({ id }).update(req.body).returning('*');
        res.json(updatedShift);
    } catch (err) {
        console.error('Error updating shift:', err);
        res.status(500).json({ message: 'Error updating shift', error: (err as Error).message });
    }
});

app.delete('/api/shifts/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db('shifts').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting shift:', err);
        res.status(500).json({ message: 'Error deleting shift', error: (err as Error).message });
    }
});

// ========================================
// PERFORMANCE ENDPOINTS
// ========================================

// Get individual staff performance
app.get('/api/performance/staff/:staffId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { start_date, end_date } = req.query;
    const { id: requestingUserId, role: requestingUserRole } = req.user!;

    // Authorization check
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'manager' && requestingUserId !== parseInt(staffId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const startDate = (start_date as string) || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const endDate = (end_date as string) || new Date().toISOString().split('T')[0];

    // Get orders data
    const ordersData = await db('orders')
      .where('staff_id', staffId)
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_orders'),
        db.raw('COUNT(CASE WHEN status = \'cancelled\' THEN 1 END) as cancelled_orders'),
        db.raw('SUM(total_amount) as total_sales'),
        db.raw('AVG(total_amount) as avg_order_value'),
        db.raw('SUM(tip_amount) as total_tips'),
        db.raw('AVG(customer_rating) as avg_rating'),
        db.raw('AVG(service_time_minutes) as avg_service_time')
      )
      .first();

    // Get shift data
    const shiftData = await db('shifts')
      .where('staff_id', staffId)
      .whereBetween('shift_date', [startDate, endDate])
      .where('status', 'completed')
      .select(
        db.raw('COUNT(*) as total_shifts'),
        db.raw('SUM(EXTRACT(EPOCH FROM (actual_end_time - actual_start_time)) / 3600) as total_hours')
      )
      .first();

    // Get attendance punctuality
    const attendanceData = await db('attendance_log')
      .join('shifts', 'attendance_log.shift_id', 'shifts.id')
      .where('attendance_log.staff_id', staffId)
      .whereBetween('shifts.shift_date', [startDate, endDate])
      .whereNotNull('attendance_log.clock_in')
      .select(
        db.raw('COUNT(*) as total_attended'),
        db.raw(`
          COUNT(
            CASE WHEN attendance_log.clock_in <= (shifts.shift_date::date + shifts.start_time::time)
            THEN 1 END
          ) as on_time_count
        `)
      )
      .first();

    const punctualityScore =
      attendanceData && attendanceData.total_attended > 0
        ? ((Number(attendanceData.on_time_count) / Number(attendanceData.total_attended)) * 100).toFixed(0)
        : 100;

    res.json({
      period: { start: startDate, end: endDate },
      orders: {
        total: parseInt(String(ordersData?.total_orders ?? 0)),
        completed: parseInt(String(ordersData?.completed_orders ?? 0)),
        cancelled: parseInt(String(ordersData?.cancelled_orders ?? 0)),
        completionRate:
          ordersData && ordersData.total_orders > 0
            ? ((Number(ordersData.completed_orders) / Number(ordersData.total_orders)) * 100).toFixed(1)
            : "0",
      },
      financial: {
        totalSales: parseFloat(String(ordersData?.total_sales ?? 0)),
        avgOrderValue: parseFloat(String(ordersData?.avg_order_value ?? 0)),
        totalTips: parseFloat(String(ordersData?.total_tips ?? 0)),
      },
      service: {
        avgRating: parseFloat(String(ordersData?.avg_rating ?? 0)).toFixed(2),
        avgServiceTime: parseFloat(String(ordersData?.avg_service_time ?? 0)).toFixed(0),
      },
      attendance: {
        totalShifts: parseInt(String(shiftData?.total_shifts ?? 0)),
        totalHours: parseFloat(String(shiftData?.total_hours ?? 0)).toFixed(2),
        punctualityScore: parseInt(String(punctualityScore)),
      },
    });
  } catch (err) {
    console.error("Error fetching staff performance:", err);
    res.status(500).json({ message: "Error fetching performance data" });
  }
});

// Get all staff performance (for managers/admins)
app.get('/api/performance/all', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, role } = req.query;

    const startDate = (start_date as string) || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const endDate = (end_date as string) || new Date().toISOString().split('T')[0];

    let query = db('staff')
      .leftJoin('orders', function() {
        this.on('staff.id', '=', 'orders.staff_id')
          .andOnBetween('orders.created_at', [startDate, endDate]);
      })
      .where('staff.is_active', true)
      .groupBy('staff.id', 'staff.name', 'staff.role', 'staff.employee_id')
      .select(
        'staff.id',
        'staff.name',
        'staff.role',
        'staff.employee_id',
        db.raw('COUNT(orders.id) as total_orders'),
        db.raw('COUNT(CASE WHEN orders.status = \'completed\' THEN 1 END) as completed_orders'),
        db.raw('SUM(orders.total_amount) as total_sales'),
        db.raw('AVG(orders.total_amount) as avg_order_value'),
        db.raw('AVG(orders.customer_rating) as avg_rating')
      );

    if (role) {
      query = query.where('staff.role', role as string);
    }

    const performance = await query;

    res.json(performance.map(p => ({
      staffId: p.id,
      name: p.name,
      role: p.role,
      employeeId: p.employee_id,
      totalOrders: parseInt(p.total_orders || 0),
      completedOrders: parseInt(p.completed_orders || 0),
      totalSales: parseFloat(p.total_sales || 0),
      avgOrderValue: parseFloat(p.avg_order_value || 0),
      avgRating: parseFloat(p.avg_rating || 0).toFixed(2)
    })));
  } catch (err) {
    console.error('Error fetching all performance:', err);
    res.status(500).json({ message: 'Error fetching performance data' });
  }
});

// Get waiter performance (for receptionists)
app.get('/api/performance/waiters', authenticateToken, authorizeRoles('admin', 'manager', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const startDate = (start_date as string) || new Date().toISOString().split('T')[0];
    const endDate = (end_date as string) || new Date().toISOString().split('T')[0];

    const waiterPerformance = await db('staff')
      .leftJoin('orders', function() {
        this.on('staff.id', '=', 'orders.staff_id')
          .andOnBetween('orders.created_at', [startDate, endDate]);
      })
      .where('staff.role', 'waiter')
      .where('staff.is_active', true)
      .groupBy('staff.id', 'staff.name', 'staff.employee_id')
      .select(
        'staff.id',
        'staff.name',
        'staff.employee_id',
        db.raw('COUNT(orders.id) as total_orders'),
        db.raw('COUNT(CASE WHEN orders.status = \'completed\' THEN 1 END) as completed_orders'),
        db.raw('SUM(orders.total_amount) as total_sales'),
        db.raw('AVG(orders.customer_rating) as avg_rating')
      )
      .orderByRaw('SUM(orders.total_amount) DESC');

    res.json(waiterPerformance.map(w => ({
      staffId: w.id,
      name: w.name,
      employeeId: w.employee_id,
      totalOrders: parseInt(w.total_orders || 0),
      completedOrders: parseInt(w.completed_orders || 0),
      totalSales: parseFloat(w.total_sales || 0),
      avgRating: parseFloat(w.avg_rating || 0).toFixed(2)
    })));
  } catch (err) {
    console.error('Error fetching waiter performance:', err);
    res.status(500).json({ message: 'Error fetching waiter performance' });
  }
});

// Add tip to order
app.post('/api/tips', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { order_id, staff_id, amount, payment_method } = req.body;

    const [tip] = await db('tips')
      .insert({
        order_id,
        staff_id,
        amount,
        payment_method,
        received_at: new Date().toISOString()
      })
      .returning('*');

    // Update order tip_amount
    await db('orders')
      .where({ id: order_id })
      .update({
        tip_amount: db.raw('tip_amount + ?', [amount])
      });

    res.status(201).json(tip);
  } catch (err) {
    console.error('Error adding tip:', err);
    res.status(500).json({ message: 'Error adding tip' });
  }
});

// Submit customer feedback
app.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    const { order_id, staff_id, rating, feedback_text, feedback_category } = req.body;

    const [feedback] = await db('customer_feedback')
      .insert({
        order_id,
        staff_id,
        rating,
        feedback_text,
        feedback_category,
        created_at: new Date().toISOString()
      })
      .returning('*');

    // Update order rating
    if (order_id) {
      await db('orders')
        .where({ id: order_id })
        .update({ customer_rating: rating });
    }

    res.status(201).json(feedback);
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'Error submitting feedback' });
  }
});

app.post('/api/products', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        console.log('=== ADD PRODUCT REQUEST ===');
        console.log('Received product data:', req.body);
        
        if (!req.body.name || !req.body.category_id) {
            return res.status(400).json({ message: 'Name and category_id are required' });
        }

        const productData = {
            category_id: parseInt(req.body.category_id),
            name: req.body.name,
            description: req.body.description || '',
            price: parseFloat(req.body.price) || 0,
            cost: parseFloat(req.body.cost) || 0,
            preparation_time: parseInt(req.body.preparation_time) || 0,
            image_url: req.body.image_url || '',
            is_available: req.body.is_available !== undefined ? req.body.is_available : true,
            is_active: req.body.is_active !== undefined ? req.body.is_active : true
        };

        const returnedProducts = await db('products').insert(productData).returning('*');
        const newProduct = returnedProducts[0];

        if (!newProduct) {
            throw new Error("Product creation failed: Did not get the new product back from the database.");
        }

        console.log('=== PRODUCT ADDED SUCCESSFULLY ===');
        res.status(201).json(newProduct);

    } catch (err) {
        console.error('=== ERROR ADDING PRODUCT ===', err);
        res.status(500).json({ 
            message: 'Error adding product', 
            error: (err as Error).message
        });
    }
});

app.get('/api/products', async (req: Request, res: Response) => {
    try {
        const products = await db('products')
            .join('categories', 'products.category_id', 'categories.id')
            .select('products.*', 'categories.name as category_name')
            .orderBy('products.name', 'asc');
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ 
            message: 'Error fetching products',
            error: (err as Error).message 
        });
    }
});

app.delete('/api/products/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await db('products').where({ id }).del();

    if (deleted) {
      res.json({ message: `Product ${id} deleted successfully` });
    } else {
      res.status(404).json({ message: `Product ${id} not found` });
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: (err as Error).message });
  }
});

// Category Management
app.get('/api/categories', async (req: Request, res: Response) => {
    try {
        const categories = await db('categories').orderBy('name', 'asc');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

app.post('/api/categories', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const [newCategory] = await db('categories').insert(req.body).returning('*');
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ message: 'Error adding category' });
    }
});

app.put('/api/categories/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updatedCategory] = await db('categories').where({ id }).update(req.body).returning('*');
        res.json(updatedCategory);
    } catch (err) {
        res.status(500).json({ message: 'Error updating category' });
    }
});

app.delete('/api/categories/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db('categories').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// Inventory Management
app.get('/api/inventory', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userRole = req.user?.role;
        let inventory;

        if (!userRole) {
            return res.status(403).json({ message: 'User role not found' });
        }

        if (['admin', 'manager'].includes(userRole)) {
            // Admin and manager can see all inventory
            inventory = await db('inventory_items').select('*').orderBy('name', 'asc');
        } else if (userRole === 'kitchen' || userRole === 'kitchen_staff') {
            // Kitchen staff can only see kitchen items
            inventory = await db('inventory_items')
                .where('inventory_type', 'kitchen')
                .select('*')
                .orderBy('name', 'asc');
        } else if (userRole === 'receptionist') {
            // Receptionists can see bar, housekeeping, and minibar items
            inventory = await db('inventory_items')
                .whereIn('inventory_type', ['bar', 'housekeeping', 'minibar'])
                .select('*')
                .orderBy('name', 'asc');
        } else {
            // No access for other roles
            return res.status(403).json({ message: 'You do not have permission to view inventory' });
        }

        res.json(inventory);
    } catch (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).json({ message: 'Error fetching inventory', error: (err as Error).message });
    }
});

app.post('/api/inventory', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const inventoryData = {
      ...req.body,
      last_restock_date: new Date().toISOString(),
      is_active: req.body.is_active !== undefined ? req.body.is_active : true
    };

    const [insertedItem] = await db('inventory_items')
      .insert(inventoryData)
      .returning('*');

    res.status(201).json(insertedItem);
  } catch (err) {
    console.error('Error adding inventory item:', err);
    res.status(500).json({ 
      message: 'Error adding inventory item', 
      error: (err as Error).message 
    });
  }
});

app.put('/api/inventory/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            last_restock_date: new Date().toISOString()
        };

        await db('inventory_items').where({ id }).update(updateData);
        const updatedItem = await db('inventory_items').where({ id }).first();

        if (!updatedItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.json(updatedItem);
    } catch (err) {
        console.error('Error updating inventory item:', err);
        res.status(500).json({ 
            message: 'Error updating inventory item',
            error: (err as Error).message
        });
    }
});

app.delete('/api/inventory/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await db('inventory_items').where({ id }).del();
        
        if (deleted === 0) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.status(204).send();
    } catch (err) {
        console.error('Error deleting inventory item:', err);
        res.status(500).json({ 
            message: 'Error deleting inventory item',
            error: (err as Error).message
        });
    }
});

// Room and Table Management
app.get('/api/rooms', authenticateToken, async (req: Request, res: Response) => {
    try {
        const rooms = await db('rooms').select('*').orderBy('room_number', 'asc');
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});

app.post('/api/rooms', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const [newRoom] = await db('rooms').insert(req.body).returning('*');
        res.status(201).json(newRoom);
    } catch (err) {
        res.status(500).json({ message: 'Error adding room' });
    }
});

app.put('/api/rooms/:id', authenticateToken, authorizeRoles('admin', 'manager', 'receptionist', 'housekeeping'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updatedRoom] = await db('rooms').where({ id }).update(req.body).returning('*');
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).json({ message: 'Error updating room' });
    }
});

app.delete('/api/rooms/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db('rooms').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting room' });
    }
});

app.get('/api/tables', authenticateToken, async (req: Request, res: Response) => {
    try {
        const tables = await db('tables').select('*').orderBy('table_number', 'asc');
        res.json(tables);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tables' });
    }
});

app.post('/api/tables', authenticateToken, authorizeRoles('admin', 'manager', 'receptionist'), async (req: Request, res: Response) => {
    try {
        const [newTable] = await db('tables').insert(req.body).returning('*');
        res.status(201).json(newTable);
    } catch (err) {
        res.status(500).json({ message: 'Error adding table' });
    }
});

app.put('/api/tables/:id', authenticateToken, authorizeRoles('admin', 'manager', 'waiter', 'receptionist'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updatedTable] = await db('tables').where({ id }).update(req.body).returning('*');
        res.json(updatedTable);
    } catch (err) {
        res.status(500).json({ message: 'Error updating table' });
    }
});

app.delete('/api/tables/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db('tables').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting table' });
    }
});

// Check-In a Guest
app.post('/api/rooms/:roomId/check-in', authenticateToken, authorizeRoles('receptionist', 'admin', 'manager'), async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { guest_name, guest_contact } = req.body;
  const { id: staff_id } = req.user!;

  if (!guest_name) {
    return res.status(400).json({ message: 'Guest name is required.' });
  }

  try {
    await db.transaction(async (trx) => {
      const [updatedRoom] = await trx('rooms')
        .where({ id: roomId, status: 'vacant' })
        .update({ status: 'occupied' })
        .returning('*');

      if (!updatedRoom) {
        throw new Error('Room is not vacant or available for check-in.');
      }

      await trx('room_transactions').insert({
        room_id: roomId,
        staff_id,
        guest_name,
        guest_contact,
        status: 'active',
      });
      
      res.json(updatedRoom);
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: (err as Error).message || 'Failed to check-in guest.' });
  }
});

// Check-Out a Guest
app.post('/api/rooms/:roomId/check-out', authenticateToken, authorizeRoles('receptionist', 'admin', 'manager'), async (req: Request, res: Response) => {
  const { roomId } = req.params;

  try {
    await db.transaction(async (trx) => {
      const [updatedRoom] = await trx('rooms')
        .where({ id: roomId, status: 'occupied' })
        .update({ status: 'cleaning' })
        .returning('*');

      if (!updatedRoom) {
        throw new Error('Room is not occupied or does not exist.');
      }

      await trx('room_transactions')
        .where({ room_id: roomId, status: 'active' })
        .update({
          status: 'completed',
          check_out_time: new Date(),
        });
        
      res.json(updatedRoom);
    });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ message: (err as Error).message || 'Failed to check-out guest.' });
  }
});

// Maintenance Management
app.get('/api/maintenance-requests', authenticateToken, authorizeRoles('admin', 'manager', 'housekeeping'), async (req: Request, res: Response) => {
    try {
        const requests = await db('maintenance_requests').select('*').whereNot('status', 'completed').orderBy('created_at', 'desc');
        res.json(requests);
    } catch (err) {
        console.error('Error fetching maintenance requests:', err);
        res.status(500).json({ message: 'Error fetching maintenance requests', error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined });
    }
});

app.post('/api/maintenance-requests', authenticateToken, authorizeRoles('admin', 'manager', 'housekeeping', 'receptionist'), async (req: Request, res: Response) => {
    try {
        const [newRequest] = await db('maintenance_requests').insert(req.body).returning('*');
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(500).json({ message: 'Error creating maintenance request' });
    }
});

app.put('/api/maintenance-requests/:id', authenticateToken, authorizeRoles('admin', 'manager', 'housekeeping'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updatedRequest] = await db('maintenance_requests').where({ id }).update(req.body).returning('*');
        res.json(updatedRequest);
    } catch (err) {
        res.status(500).json({ message: 'Error updating maintenance request' });
    }
});

// Delivery Management
app.get('/api/deliveries', authenticateToken, authorizeRoles('admin', 'manager', 'delivery'), async (req: Request, res: Response) => {
    try {
        const activeDeliveries = await db('orders')
            .where({ order_type: 'delivery' })
            .whereNot('delivery_status', 'delivered')
            .orderBy('created_at', 'asc');
        
        for (const order of activeDeliveries) {
            (order as any).items = await db('order_items')
                .join('products', 'order_items.product_id', 'products.id')
                .where('order_id', order.id)
                .select('order_items.quantity', 'products.name as product_name');
        }

        res.json(activeDeliveries);
    } catch (err) {
        console.error("Delivery orders fetch error:", err);
        res.status(500).json({ message: 'Error fetching delivery orders' });
    }
});

app.put('/api/deliveries/:orderId/status', authenticateToken, authorizeRoles('admin', 'manager', 'delivery'), async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['unassigned', 'assigned', 'out_for_delivery', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid delivery status' });
        }

        const [updatedOrder] = await db('orders')
            .where({ id: orderId, order_type: 'delivery' })
            .update({ delivery_status: status })
            .returning('*');
        
        if (updatedOrder) {
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Delivery order not found' });
        }
    } catch (err) {
        console.error("Delivery status update error:", err);
        res.status(500).json({ message: 'Error updating delivery status' });
    }
});

// Settings Management
app.get('/api/settings', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    try {
        const settingsArray = await db('settings').select('*');
        const settingsObject = settingsArray.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as Record<string, string>);
        res.json(settingsObject);
    } catch (err) {
        console.error("Error fetching settings:", err);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

app.put('/api/settings', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
    const settings = req.body;
    try {
        await db.transaction(async trx => {
            for (const key in settings) {
                if (Object.prototype.hasOwnProperty.call(settings, key)) {
                    await trx('settings').where({ key }).update({ value: settings[key] });
                }
            }
        });
        res.status(200).json({ message: 'Settings updated successfully' });
    } catch (err) {
        console.error("Error updating settings:", err);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// --- Reporting Endpoints ---
function setNoCacheHeaders(res: Response) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
}

app.get('/api/reports/overview', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);
    const { start, end } = req.query;
    if (typeof start !== 'string' || typeof end !== 'string') return res.status(400).json({ message: 'Start and end date queries are required.' });

    const sales = await db('orders').whereBetween('created_at', [start, end]).sum('total_amount as total').first();
    const ordersTotal = await db('orders').whereBetween('created_at', [start, end]).count('id as total').first();
    const completedOrders = await db('orders').whereBetween('created_at', [start, end]).where('status', 'completed').count('id as total').first();
    const avgOrderValue = await db('orders').whereBetween('created_at', [start, end]).avg('total_amount as avg').first();
    const topSellingItems = await db('order_items')
      .join('products', 'order_items.product_id', 'products.id')
      .join('orders', 'order_items.order_id', 'orders.id')
      .whereBetween('orders.created_at', [start, end])
      .select('products.name')
      .sum('order_items.quantity as quantity')
      .sum('order_items.total_price as revenue')
      .groupBy('products.name', 'products.id')
      .orderBy('revenue', 'desc')
      .limit(5);
    const topPerformers = await db('orders')
      .join('staff', 'orders.staff_id', 'staff.id')
      .whereBetween('orders.created_at', [start, end])
      .select('staff.name')
      .count('orders.id as orders')
      .sum('orders.total_amount as revenue')
      .groupBy('staff.name', 'staff.id')
      .orderBy('revenue', 'desc')
      .limit(4);

    res.json({
      sales: { monthly: parseFloat((sales as any)?.total || 0) },
      orders: {
        total: parseInt((ordersTotal as any)?.total || 0),
        completed: parseInt((completedOrders as any)?.total || 0),
        averageValue: parseFloat((avgOrderValue as any)?.avg || 0)
      },
      inventory: { topSellingItems: topSellingItems.map(item => ({ name: item.name, quantity: parseInt(item.quantity), revenue: parseFloat(item.revenue) })) },
      staff: { topPerformers: topPerformers.map(staff => ({ name: staff.name, orders: parseInt(staff.orders), revenue: parseFloat(staff.revenue) })) }
    });
  } catch (err) {
    console.error("Overview report error:", err);
    res.status(500).json({ message: 'Error generating overview report', error: (err as Error).message });
  }
});

app.get('/api/reports/sales', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);
    const { start, end } = req.query;
    if (typeof start !== 'string' || typeof end !== 'string') return res.status(400).json({ message: 'Start and end date queries are required.' });

    const salesByDay = await db('orders')
      .whereBetween('created_at', [start, end])
      .select(db.raw("DATE(created_at) as date"))
      .sum('total_amount as total')
      .groupBy(db.raw("DATE(created_at)"))
      .orderBy('date', 'asc');

    res.json({ salesByDay: salesByDay.map((day: any) => ({ date: day.date, total: parseFloat(day.total || 0) })) });
  } catch (err) {
    console.error("Sales report error:", err);
    res.status(500).json({ message: 'Error generating sales report', error: (err as Error).message });
  }
});

app.get('/api/reports/inventory', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);
    const lowStockItems = await db('inventory_items').whereRaw('current_stock <= minimum_stock').where('is_active', 1).select('id', 'name', 'current_stock', 'minimum_stock').orderBy('current_stock', 'asc');
    const totalValueResult = await db('inventory_items').where('is_active', 1).select(db.raw('SUM(current_stock * cost_per_unit) as total')).first();
    res.json({
      lowStockItems: lowStockItems.map(item => ({ id: item.id, name: item.name, current_stock: parseInt(item.current_stock || 0), minimum_stock: parseInt(item.minimum_stock || 0) })),
      totalValue: parseFloat((totalValueResult as any)?.total || 0)
    });
  } catch (err) {
    console.error("Inventory report error:", err);
    res.status(500).json({ message: 'Error generating inventory report', error: (err as Error).message });
  }
});

app.get('/api/reports/staff', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);
    const { start, end } = req.query;
    if (typeof start !== 'string' || typeof end !== 'string') return res.status(400).json({ message: 'Start and end date queries are required.' });

    const staffPerformance = await db('orders')
      .join('staff', 'orders.staff_id', 'staff.id')
      .whereBetween('orders.created_at', [start, end])
      .select('staff.name', 'staff.role')
      .count('orders.id as orders')
      .sum('orders.total_amount as revenue')
      .avg('orders.total_amount as avgOrderValue')
      .groupBy('staff.name', 'staff.role', 'staff.id')
      .orderBy('revenue', 'desc');

    res.json(staffPerformance.map(staff => ({
      name: staff.name,
      role: staff.role,
      orders: parseInt(staff.orders || 0),
      revenue: parseFloat(staff.revenue || 0),
      avgOrderValue: parseFloat(staff.avgOrderValue || 0)
    })));
  } catch (err) {
    console.error("Staff report error:", err);
    res.status(500).json({ message: 'Error generating staff report', error: (err as Error).message });
  }
});

app.get('/api/reports/rooms', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);
    const { start, end } = req.query;
    if (typeof start !== 'string' || typeof end !== 'string') return res.status(400).json({ message: 'Start and end date queries are required.' });

    const roomRevenue = await db('orders').where('order_type', 'room_service').whereBetween('created_at', [start, end]).sum('total_amount as total').first();
    const roomStatusCounts = await db('rooms').select('status').count('id as count').groupBy('status').orderBy('status', 'asc');

    res.json({
      roomRevenue: parseFloat((roomRevenue as any)?.total || 0),
      roomStatusCounts: roomStatusCounts.map(status => ({ status: status.status, count: parseInt(String(status.count || 0)) }))
    });
  } catch (err) {
    console.error("Room report error:", err);
    res.status(500).json({ message: 'Error generating room report', error: (err as Error).message });
  }
});

// Debug Endpoints
app.get('/api/debug/reports', async (req: Request, res: Response) => {
  try {
    const ordersCount = await db('orders').count('* as count').first();
    const staffCount = await db('staff').count('* as count').first();
    const roomsCount = await db('rooms').count('* as count').first();
    const inventoryCount = await db('inventory_items').count('* as count').first();
    
    const sampleOrder = await db('orders').first();
    const sampleStaff = await db('staff').first();
    
    res.json({
      counts: {
        orders: ordersCount,
        staff: staffCount, 
        rooms: roomsCount,
        inventory: inventoryCount
      },
      samples: {
        order: sampleOrder,
        staff: sampleStaff
      }
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/debug/seed-orders', async (req: Request, res: Response) => {
  try {
    const staff = await db('staff').first();
    const products = await db('products').limit(3);
    
    if (!staff) {
      return res.status(400).json({ error: 'No staff found. Add staff first.' });
    }
    
    if (products.length === 0) {
      return res.status(400).json({ error: 'No products found. Add products first.' });
    }
    
    const orders: string[] = [];
    for (let i = 0; i < 5; i++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - i);
      
      const insertResult = await db('orders').insert({
        order_number: `ORD-${Date.now()}-${i}`,
        order_type: i % 2 === 0 ? 'dine_in' : 'room_service',
        location: i % 2 === 0 ? 'Table 1' : 'Room 101',
        staff_id: staff.id,
        total_amount: 1500 + (i * 300),
        status: 'completed',
        created_at: orderDate.toISOString()
      }).returning('id');
      
      let actualOrderId: number;
      if (typeof insertResult[0] === 'number') {
        actualOrderId = insertResult[0];
      } else if (insertResult[0] && typeof insertResult[0] === 'object' && 'id' in insertResult[0]) {
        actualOrderId = insertResult[0].id as number;
      } else {
        throw new Error('Failed to get order ID from insert');
      }
      
      await db('order_items').insert({
        order_id: actualOrderId,
        product_id: products[0].id,
        quantity: 2,
        unit_price: products[0].price,
        total_price: products[0].price * 2
      });
      
      orders.push(String(actualOrderId));
    }
    
    res.json({ 
      message: 'Sample orders created!', 
      orderIds: orders,
      count: orders.length 
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- NEW FEATURES ENDPOINTS ---

// Password Reset Functionality - Enhanced with Email
app.post('/api/auth/request-password-reset', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await db('staff').where({ username, is_active: true }).first();
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If the username exists, a reset code has been sent to your email' });
    }

    if (!user.email) {
      return res.status(400).json({ message: 'No email address found for this user. Contact administrator.' });
    }

    // Generate 6-digit numeric reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store reset code in database
    await db('password_reset_tokens').insert({
      user_id: user.id,
      token: resetCode,
      expires_at: expiresAt
    });

    // Send email with reset code
    const emailSent = await sendResetEmail(user.email, resetCode, user.name);
    
    if (!emailSent) {
      // Clean up the token if email failed
      await db('password_reset_tokens').where({ user_id: user.id, token: resetCode }).del();
      return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }

    res.json({ 
      message: 'A 6-digit reset code has been sent to your email address',
      expires_in_minutes: 10,
      email_sent: true
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
});

app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Reset code and new password are required' });
    }

    // Validate 6-digit code format
    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({ message: 'Reset code must be a 6-digit number' });
    }

    const resetToken = await db('password_reset_tokens')
      .where({ token, used: false })
      .where('expires_at', '>', new Date())
      .first();

    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    // Update password and mark token as used
    await db.transaction(async trx => {
      await trx('staff').where({ id: resetToken.user_id }).update({ password: newPassword });
      await trx('password_reset_tokens').where({ id: resetToken.id }).update({ used: true });
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Enhanced Login with Session Tracking
app.post('/api/auth/login-with-tracking', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const user = await db('staff').where({ username, is_active: true }).first();
    if (user && user.password === password) {
      const { password: _, pin: __, ...userWithoutSensitiveData } = user;
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      
      // Track login session
      await db('user_sessions').insert({
        user_id: user.id,
        session_token: token,
        is_active: true
      });

      res.json({ user: userWithoutSensitiveData, token });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login with tracking error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout with Session Tracking
app.post('/api/auth/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    // Mark session as inactive
    await db('user_sessions')
      .where({ session_token: token, is_active: true })
      .update({ logout_time: new Date(), is_active: false });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Error during logout' });
  }
});

// Get Active Users (Admin Dashboard)
app.get('/api/admin/active-users', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const activeUsers = await db('user_sessions as us')
      .join('staff as s', 'us.user_id', 's.id')
      .where('us.is_active', true)
      .select(
        's.id',
        's.name',
        's.role',
        'us.login_time'
      )
      .orderBy('us.login_time', 'desc');

    res.json(activeUsers);
  } catch (err) {
    console.error('Active users fetch error:', err);
    res.status(500).json({ message: 'Error fetching active users' });
  }
});

// Role-based Inventory Updates
app.put('/api/inventory/:id/stock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { current_stock } = req.body;
    const userRole = req.user?.role;

    if (!current_stock) {
      return res.status(400).json({ message: 'Current stock is required' });
    }

    // Get inventory item with role permissions
    const inventoryItem = await db('inventory_items').where({ id }).first();
    
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if user has permission to update this inventory item
    const allowedRoles = inventoryItem.allowed_roles || [];
    if (!userRole || (!allowedRoles.includes(userRole) && !['admin', 'manager'].includes(userRole))) {
      return res.status(403).json({ 
        message: `You don't have permission to update ${inventoryItem.inventory_type} items` 
      });
    }

    const [updatedItem] = await db('inventory_items')
      .where({ id })
      .update({ current_stock, updated_at: new Date() })
      .returning('*');

    res.json(updatedItem);
  } catch (err) {
    console.error('Inventory update error:', err);
    res.status(500).json({ message: 'Error updating inventory' });
  }
});

// Low Stock Alerts
app.get('/api/admin/low-stock-alerts', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const lowStockItems = await db('inventory_items')
      .whereRaw('current_stock <= minimum_stock')
      .andWhere('is_active', true)
      .select('*')
      .orderBy('inventory_type');

    res.json(lowStockItems);
  } catch (err) {
    console.error('Low stock alerts error:', err);
    res.status(500).json({ message: 'Error fetching low stock alerts' });
  }
});

// Personal Sales Reports
app.get('/api/reports/personal-sales', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const salesReport = await db('daily_sales_by_staff')
      .where({ staff_id: userId, sales_date: targetDate })
      .first();

    if (!salesReport) {
      return res.json({
        staff_id: userId,
        sales_date: targetDate,
        total_orders: 0,
        total_sales: 0,
        total_service_charge: 0
      });
    }

    res.json(salesReport);
  } catch (err) {
    console.error('Personal sales report error:', err);
    res.status(500).json({ message: 'Error fetching personal sales report' });
  }
});

// Waiter Sales Monitoring (for Receptionists)
app.get('/api/reports/waiter-sales', authenticateToken, authorizeRoles('admin', 'manager', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { date, waiter_id } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let query = db('daily_sales_by_staff')
      .where({ sales_date: targetDate });

    if (waiter_id) {
      query = query.andWhere({ staff_id: waiter_id });
    } else {
      query = query.whereIn('staff_role', ['waiter']);
    }

    const waiterSales = await query.orderBy('total_sales', 'desc');

    res.json(waiterSales);
  } catch (err) {
    console.error('Waiter sales report error:', err);
    res.status(500).json({ message: 'Error fetching waiter sales report' });
  }
});

// Enhanced Order Creation with Table Assignment and Customer Name
app.post('/api/orders/create-with-details', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { 
      order_type, 
      table_id, 
      room_id, 
      customer_name, 
      customer_phone, 
      items, 
      notes 
    } = req.body;

    const waiterId = req.user?.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    if (order_type === 'dine_in' && !table_id) {
      return res.status(400).json({ message: 'Table ID is required for dine-in orders' });
    }

    if (order_type === 'room_service' && !room_id) {
      return res.status(400).json({ message: 'Room ID is required for room service orders' });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    let subtotal = 0;
    items.forEach((item: any) => {
      subtotal += item.unit_price * item.quantity;
    });

    const serviceCharge = subtotal * 0.1; // 10% service charge
    const totalAmount = subtotal + serviceCharge;

    const result = await db.transaction(async trx => {
      const [order] = await trx('orders').insert({
        order_number: orderNumber,
        order_type,
        table_id: table_id || null,
        room_id: room_id || null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        staff_id: waiterId,
        subtotal,
        service_charge: serviceCharge,
        total_amount: totalAmount,
        notes,
        status: 'pending'
      }).returning('*');

      for (const item of items) {
        await trx('order_items').insert({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          notes: item.notes
        });
      }

      return order;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Enhanced order creation error:', err);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// --- GLOBAL SEARCH API ---
app.get('/api/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { q, limit = 10, offset = 0 } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
    }

    const searchTerm = `%${q.toLowerCase()}%`;
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);
    const userRole = req.user?.role;

    interface SearchResult {
      id: number;
      type: 'staff' | 'inventory' | 'menu' | 'order' | 'room';
      title: string;
      subtitle: string;
      description?: string;
      metadata?: any;
    }

    const searchResults: SearchResult[] = [];

    // Search Staff (admin/manager only)
    if (['admin', 'manager'].includes(userRole || '')) {
      const staffResults = await db('staff')
        .whereRaw('LOWER(name) LIKE ?', [searchTerm])
        .orWhereRaw('LOWER(username) LIKE ?', [searchTerm])
        .orWhereRaw('LOWER(employee_id) LIKE ?', [searchTerm])
        .limit(limitNum)
        .select('id', 'name', 'username', 'employee_id', 'role', 'is_active', 'created_at');

      for (const staff of staffResults) {
        searchResults.push({
          id: staff.id,
          type: 'staff',
          title: staff.name,
          subtitle: `${staff.username} (${staff.employee_id})`,
          description: `${staff.role} - ${staff.is_active ? 'Active' : 'Inactive'}`,
          metadata: {
            role: staff.role,
            is_active: staff.is_active,
            created_at: staff.created_at
          }
        });
      }
    }

    // Search Inventory
    const inventoryResults = await db('inventory_items')
      .whereRaw('LOWER(name) LIKE ?', [searchTerm])
      .orWhereRaw('LOWER(inventory_type) LIKE ?', [searchTerm])
      .andWhere('is_active', true)
      .limit(limitNum)
      .select('id', 'name', 'inventory_type', 'current_stock', 'minimum_stock', 'unit', 'created_at');

    for (const item of inventoryResults) {
      searchResults.push({
        id: item.id,
        type: 'inventory',
        title: item.name,
        subtitle: `${item.inventory_type} - ${item.current_stock} ${item.unit}`,
        description: `Stock Level: ${item.current_stock}/${item.minimum_stock} ${item.unit}`,
        metadata: {
          current_stock: item.current_stock,
          minimum_stock: item.minimum_stock,
          unit: item.unit,
          inventory_type: item.inventory_type,
          created_at: item.created_at
        }
      });
    }

    // Search Menu Items/Products
    const menuResults = await db('products')
      .whereRaw('LOWER(name) LIKE ?', [searchTerm])
      .orWhereRaw('LOWER(description) LIKE ?', [searchTerm])
      .limit(limitNum)
      .select('id', 'name', 'description', 'price', 'is_available', 'created_at');

    for (const product of menuResults) {
      searchResults.push({
        id: product.id,
        type: 'menu',
        title: product.name,
        subtitle: `KES ${product.price} - ${product.is_available ? 'Available' : 'Unavailable'}`,
        description: product.description,
        metadata: {
          price: product.price,
          is_available: product.is_available,
          created_at: product.created_at
        }
      });
    }

    // Search Orders
    const orderResults = await db('orders')
      .whereRaw('LOWER(order_number) LIKE ?', [searchTerm])
      .orWhereRaw('LOWER(customer_name) LIKE ?', [searchTerm])
      .orWhereRaw('LOWER(order_type) LIKE ?', [searchTerm])
      .limit(limitNum)
      .select('id', 'order_number', 'customer_name', 'order_type', 'total_amount', 'status', 'created_at');

    for (const order of orderResults) {
      searchResults.push({
        id: order.id,
        type: 'order',
        title: order.order_number,
        subtitle: `${order.customer_name || 'Guest'} - ${order.order_type || 'N/A'}`,
        description: `${order.status} - KES ${order.total_amount}`,
        metadata: {
          customer_name: order.customer_name,
          order_type: order.order_type,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at
        }
      });
    }

    // Search Rooms
    const roomResults = await db('rooms')
      .whereRaw('LOWER(room_number) LIKE ?', [searchTerm])
      .orWhereRaw('LOWER(room_type) LIKE ?', [searchTerm])
      .limit(limitNum)
      .select('id', 'room_number', 'room_type', 'status', 'rate', 'created_at');

    for (const room of roomResults) {
      searchResults.push({
        id: room.id,
        type: 'room',
        title: `Room ${room.room_number}`,
        subtitle: `${room.room_type} - ${room.status}`,
        description: `KES ${room.rate}/night`,
        metadata: {
          room_number: room.room_number,
          room_type: room.room_type,
          status: room.status,
          rate: room.rate,
          created_at: room.created_at
        }
      });
    }

    // Sort results by relevance (exact matches first, then partial matches)
    searchResults.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(q.toLowerCase()) ? 0 : 1;
      const bExact = b.title.toLowerCase().includes(q.toLowerCase()) ? 0 : 1;
      return aExact - bExact;
    });

    // Apply pagination
    const paginatedResults = searchResults.slice(offsetNum, offsetNum + limitNum);

    res.json({
      results: paginatedResults,
      totalCount: searchResults.length,
      query: q,
      limit: limitNum,
      offset: offsetNum
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Error performing search' });
  }
});

// --- Catch-all route to serve frontend ---
// IMPORTANT: This must be AFTER all API routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// --- Start Server with Database Connection Test ---
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Connected to PostgreSQL successfully');
    server.listen(port, () => {
      console.log(`🚀 Backend server is running at http://localhost:${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📁 Serving frontend from: ${clientBuildPath}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
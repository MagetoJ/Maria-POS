import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import http, { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { authenticateToken, authorizeRoles } from './middleware/auth';
import path from 'path';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

import db from './db'; // <-- your PostgreSQL connection file

// --- Initialization ---
dotenv.config();
const app = express();
const server = http.createServer(app);
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-and-secure-key-that-you-should-change';

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
const clientBuildPath = path.join(__dirname, '../../client/dist');
console.log('📁 Serving static files from:', clientBuildPath);
app.use(express.static(clientBuildPath));

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

// --- PUBLIC API Endpoints ---
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.post('/api/login', async (req, res) => {
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

app.post('/api/validate-pin', async (req, res) => {
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
app.get('/api/staff', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const staff = await db('staff').select('id', 'employee_id', 'username', 'name', 'role', 'pin', 'is_active', 'created_at');
    res.json(staff);
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ message: 'Error fetching staff' });
  }
});

app.post('/api/staff', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const [newStaff] = await db('staff').insert(req.body).returning('*');
    res.status(201).json(newStaff);
  } catch (err) {
    console.error('Error adding staff member:', err);
    res.status(500).json({ message: 'Error adding staff member', error: (err as Error).message });
  }
});

app.put('/api/staff/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const [updatedStaff] = await db('staff').where({ id }).update(req.body).returning('*');
    res.json(updatedStaff);
  } catch (err) {
    console.error('Error updating staff member:', err);
    res.status(500).json({ message: 'Error updating staff member' });
  }
});

app.delete('/api/staff/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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
app.get('/api/dashboard/overview-stats', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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
app.get('/api/waiters', async (req, res) => {
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

app.post('/api/orders', async (req, res) => {
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

app.post('/api/attendance/clock-out', authenticateToken, async (req, res) => {
  try {
    const { id: staffId } = (req as any).user;

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
app.get('/api/shifts/my-shifts', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const userId = (req as any).user?.id;

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

app.get('/api/shifts', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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

app.post('/api/shifts', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const [newShift] = await db('shifts').insert(req.body).returning('*');
        res.status(201).json(newShift);
    } catch (err) {
        console.error('Error creating shift:', err);
        res.status(500).json({ message: 'Error creating shift', error: (err as Error).message });
    }
});

app.put('/api/shifts/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedShift] = await db('shifts').where({ id }).update(req.body).returning('*');
        res.json(updatedShift);
    } catch (err) {
        console.error('Error updating shift:', err);
        res.status(500).json({ message: 'Error updating shift', error: (err as Error).message });
    }
});

app.delete('/api/shifts/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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
app.get('/api/performance/staff/:staffId', authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { start_date, end_date } = req.query;
    const { id: requestingUserId, role: requestingUserRole } = (req as any).user;

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
app.get('/api/performance/all', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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
app.get('/api/performance/waiters', authenticateToken, authorizeRoles('admin', 'manager', 'receptionist'), async (req, res) => {
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
app.post('/api/tips', authenticateToken, async (req, res) => {
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
app.post('/api/feedback', async (req, res) => {
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

app.post('/api/products', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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

app.get('/api/products', async (req, res) => {
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

app.delete('/api/products/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await db('categories').orderBy('name', 'asc');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

app.post('/api/categories', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const [newCategory] = await db('categories').insert(req.body).returning('*');
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ message: 'Error adding category' });
    }
});

app.put('/api/categories/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedCategory] = await db('categories').where({ id }).update(req.body).returning('*');
        res.json(updatedCategory);
    } catch (err) {
        res.status(500).json({ message: 'Error updating category' });
    }
});

app.delete('/api/categories/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        await db('categories').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// Inventory Management
app.get('/api/inventory', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const inventory = await db('inventory_items').select('*').orderBy('name', 'asc');
        res.json(inventory);
    } catch (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).json({ message: 'Error fetching inventory', error: (err as Error).message });
    }
});

app.post('/api/inventory', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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

app.put('/api/inventory/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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

app.delete('/api/inventory/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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
app.get('/api/rooms', authenticateToken, async (req, res) => {
    try {
        const rooms = await db('rooms').select('*').orderBy('room_number', 'asc');
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});

app.post('/api/rooms', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const [newRoom] = await db('rooms').insert(req.body).returning('*');
        res.status(201).json(newRoom);
    } catch (err) {
        res.status(500).json({ message: 'Error adding room' });
    }
});

app.put('/api/rooms/:id', authenticateToken, authorizeRoles('admin', 'manager', 'receptionist', 'housekeeping'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedRoom] = await db('rooms').where({ id }).update(req.body).returning('*');
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).json({ message: 'Error updating room' });
    }
});

app.delete('/api/rooms/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        await db('rooms').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting room' });
    }
});

app.get('/api/tables', authenticateToken, async (req, res) => {
    try {
        const tables = await db('tables').select('*').orderBy('table_number', 'asc');
        res.json(tables);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tables' });
    }
});

app.post('/api/tables', authenticateToken, authorizeRoles('admin', 'manager', 'receptionist'), async (req, res) => {
    try {
        const [newTable] = await db('tables').insert(req.body).returning('*');
        res.status(201).json(newTable);
    } catch (err) {
        res.status(500).json({ message: 'Error adding table' });
    }
});

app.put('/api/tables/:id', authenticateToken, authorizeRoles('admin', 'manager', 'waiter', 'receptionist'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedTable] = await db('tables').where({ id }).update(req.body).returning('*');
        res.json(updatedTable);
    } catch (err) {
        res.status(500).json({ message: 'Error updating table' });
    }
});

app.delete('/api/tables/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        await db('tables').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting table' });
    }
});

// Check-In a Guest
app.post('/api/rooms/:roomId/check-in', authenticateToken, authorizeRoles('receptionist', 'admin', 'manager'), async (req, res) => {
  const { roomId } = req.params;
  const { guest_name, guest_contact } = req.body;
  const { id: staff_id } = (req as any).user;

  if (!guest_name) {
    return res.status(400).json({ message: 'Guest name is required.' });
  }

  try {
    await db.transaction(async (trx) => {
      const [updatedRoom] = await trx('rooms')
        .where({ id: roomId, status: 'available' })
        .update({ status: 'occupied' })
        .returning('*');

      if (!updatedRoom) {
        throw new Error('Room is not available for check-in.');
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
app.post('/api/rooms/:roomId/check-out', authenticateToken, authorizeRoles('receptionist', 'admin', 'manager'), async (req, res) => {
  const { roomId } = req.params;

  try {
    await db.transaction(async (trx) => {
      const [updatedRoom] = await trx('rooms')
        .where({ id: roomId, status: 'occupied' })
        .update({ status: 'dirty' })
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
app.get('/api/maintenance-requests', authenticateToken, authorizeRoles('admin', 'manager', 'housekeeping'), async (req, res) => {
    try {
        const requests = await db('maintenance_requests').select('*').whereNot('status', 'completed').orderBy('reported_at', 'desc');
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching maintenance requests' });
    }
});

app.post('/api/maintenance-requests', authenticateToken, authorizeRoles('admin', 'manager', 'housekeeping', 'receptionist'), async (req, res) => {
    try {
        const [newRequest] = await db('maintenance_requests').insert(req.body).returning('*');
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(500).json({ message: 'Error creating maintenance request' });
    }
});

app.put('/api/maintenance-requests/:id', authenticateToken, authorizeRoles('admin', 'manager', 'housekeeping'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedRequest] = await db('maintenance_requests').where({ id }).update(req.body).returning('*');
        res.json(updatedRequest);
    } catch (err) {
        res.status(500).json({ message: 'Error updating maintenance request' });
    }
});

// Delivery Management
app.get('/api/deliveries', authenticateToken, authorizeRoles('admin', 'manager', 'delivery'), async (req, res) => {
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

app.put('/api/deliveries/:orderId/status', authenticateToken, authorizeRoles('admin', 'manager', 'delivery'), async (req, res) => {
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
app.get('/api/settings', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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

app.put('/api/settings', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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
function setNoCacheHeaders(res: express.Response) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
}

app.get('/api/reports/overview', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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

app.get('/api/reports/sales', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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

app.get('/api/reports/inventory', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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

app.get('/api/reports/staff', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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

app.get('/api/reports/rooms', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
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
app.get('/api/debug/reports', async (req, res) => {
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

app.get('/api/debug/seed-orders', async (req, res) => {
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

// --- Catch-all route to serve frontend ---
// IMPORTANT: This must be AFTER all API routes
app.get('*', (req, res) => {
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
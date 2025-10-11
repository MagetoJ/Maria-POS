import express from 'express';
import cors from 'cors';
import knex from 'knex';
import jwt from 'jsonwebtoken';
import http, { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { authenticateToken, authorizeRoles } from './middleware/auth';
import path from 'path';
import dotenv from 'dotenv';

// --- Initialization ---
dotenv.config();
const app = express();
const server = http.createServer(app);
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-and-secure-key-that-you-should-change';

// --- Database Configuration ---
const databasePath = process.env.DATABASE_PATH || path.resolve(__dirname, '../database/pos.sqlite3');
const db = knex({
  client: 'sqlite3',
  connection: { filename: databasePath },
  useNullAsDefault: true,
  migrations: { directory: path.resolve(__dirname, '../migrations') },
});

// --- CORS Configuration ---
app.use(cors({
  origin: [
    'https://maria-havens-pos-frontend.onrender.com',
    'https://mariahavensbackend.onrender.com/',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

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
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// --- PUBLIC API Endpoints ---

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const user = await db('staff').where({ username, is_active: true }).first();
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      console.log('Login successful for:', username);
      res.json({ user: userWithoutPassword, token });
    } else {
      console.log('Invalid credentials for:', username);
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.post('/api/validate-pin', async (req, res) => {
  try {
    const { username, pin } = req.body;
    console.log('PIN validation attempt:', { username, pin: pin ? '****' : 'missing' });
    
    if (!username || !pin) {
      console.log('Validation failed: Missing username or PIN');
      return res.status(400).json({ message: 'Username and PIN are required' });
    }
    
    // Query the database
    const user = await db('staff')
      .where({ username, is_active: true })
      .first();
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('No user found with username:', username);
      return res.status(401).json({ message: 'Invalid username or PIN' });
    }
    
    // Check if PIN matches (handle both string and number comparison)
    const userPin = user.pin?.toString();
    const providedPin = pin?.toString();
    
    console.log('PIN comparison:', { 
      storedPinExists: !!userPin, 
      providedPinExists: !!providedPin,
      match: userPin === providedPin 
    });
    
    if (userPin === providedPin) {
      const { password: _, ...userWithoutPassword } = user;
      console.log('PIN validation successful for:', username);
      res.json(userWithoutPassword);
    } else {
      console.log('PIN mismatch for user:', username);
      res.status(401).json({ message: 'Invalid username or PIN' });
    }
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
        console.log('Adding staff member:', req.body);
        const [newStaff] = await db('staff').insert(req.body).returning('*');
        console.log('Staff member added successfully:', newStaff);
        res.status(201).json(newStaff);
    } catch (err) {
        console.error('Error adding staff member:', err);
        res.status(500).json({ message: 'Error adding staff member', error: (err as Error).message });
    }
});

app.put('/api/staff/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Updating staff member:', id, req.body);
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
        
        const todaysOrders = await db('orders')
            .where('created_at', '>=', today)
            .select('*');
        
        const todaysRevenue = todaysOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const ordersToday = todaysOrders.length;
        
        const activeStaff = await db('staff').where({ is_active: true }).count('* as count').first();
        const lowStock = await db('inventory_items').whereRaw('current_stock <= minimum_stock').count('* as count').first();
        
        const recentOrders = await db('orders')
            .orderBy('created_at', 'desc')
            .limit(5)
            .select('id', 'order_number', 'location', 'total_amount', 'created_at');
        
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

// Order Management
app.post('/api/orders', authenticateToken, async (req, res) => {
    const { items, ...orderData } = req.body;
    try {
        await db.transaction(async trx => {
            const [orderResult] = await trx('orders').insert(orderData).returning('id');
            const orderId = typeof orderResult === 'number' ? orderResult : orderResult.id;
            
            if (!orderId) {
                throw new Error("Failed to create order and get ID.");
            }

            const orderItems = items.map((item: any) => ({
                order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                notes: item.notes,
            }));

            if (orderItems.length > 0) {
              await trx('order_items').insert(orderItems);
            }
        });

        broadcastToKitchens({ type: 'new_order' });
        res.status(201).json({ message: 'Order created successfully' });
    } catch (err) {
        console.error("Order creation error:", err);
        res.status(500).json({ message: 'Failed to create order' });
    }
});

app.get('/api/orders/kitchen', authenticateToken, async (req, res) => {
    try {
        const activeOrders = await db('orders')
            .whereIn('status', ['pending', 'preparing'])
            .orderBy('created_at', 'asc');
        
        for (const order of activeOrders) {
            (order as any).items = await db('order_items')
                .join('products', 'order_items.product_id', 'products.id')
                .where('order_id', order.id)
                .select('order_items.*', 'products.name as product_name', 'products.preparation_time');
        }

        res.json(activeOrders);
    } catch (err) {
        console.error("Kitchen orders fetch error:", err);
        res.status(500).json({ message: 'Error fetching kitchen orders' });
    }
});

// Product Management
app.post('/api/products', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        console.log('=== ADD PRODUCT REQUEST ===');
        console.log('Received product data:', req.body);
        
        if (!req.body.name || !req.body.category_id) {
            console.log('Validation failed: Name and category_id are required');
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

        const tableInfo = await db.raw("PRAGMA table_info(products)");
        const existingColumns = tableInfo.map((col: any) => col.name);

        const filteredData: any = {};
        for (const key in productData) {
            if (existingColumns.includes(key)) {
                filteredData[key] = (productData as any)[key];
            }
        }

        const [insertId] = await db('products').insert(filteredData);
        const newProduct = await db('products').where({ id: insertId }).first();

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

        const [insertId] = await db('inventory_items').insert(inventoryData);
        const newItem = await db('inventory_items').where({ id: insertId }).first();

        res.status(201).json(newItem);
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

app.post('/api/tables', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const [newTable] = await db('tables').insert(req.body).returning('*');
        res.status(201).json(newTable);
    } catch (err) {
        res.status(500).json({ message: 'Error adding table' });
    }
});

app.put('/api/tables/:id', authenticateToken, authorizeRoles('admin', 'manager', 'waiter'), async (req, res) => {
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
app.get('/api/reports/overview', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { start, end } = req.query;
        if (typeof start !== 'string' || typeof end !== 'string') {
            return res.status(400).json({ message: 'Start and end date queries are required.' });
        }
        
        console.log(`Generating overview report for ${start} to ${end}`);
        
        const sales = await db('orders')
            .whereBetween('created_at', [start, end])
            .sum('total_amount as total')
            .first();

        const ordersTotal = await db('orders')
            .whereBetween('created_at', [start, end])
            .count('id as total')
            .first();

        const completedOrders = await db('orders')
            .whereBetween('created_at', [start, end])
            .where('status', 'completed')
            .count('id as total')
            .first();

        const avgOrderValue = await db('orders')
            .whereBetween('created_at', [start, end])
            .avg('total_amount as avg')
            .first();

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

        const result = {
            sales: { 
                monthly: parseFloat((sales as any)?.total || 0) 
            },
            orders: {
                total: parseInt((ordersTotal as any)?.total || 0),
                completed: parseInt((completedOrders as any)?.total || 0),
                averageValue: parseFloat((avgOrderValue as any)?.avg || 0)
            },
            inventory: { 
                topSellingItems: topSellingItems.map(item => ({
                    name: item.name,
                    quantity: parseInt(item.quantity),
                    revenue: parseFloat(item.revenue)
                }))
            },
            staff: { 
                topPerformers: topPerformers.map(staff => ({
                    name: staff.name,
                    orders: parseInt(staff.orders),
                    revenue: parseFloat(staff.revenue)
                }))
            }
        };

        res.json(result);
    } catch (err) {
        console.error("Overview report error:", err);
        res.status(500).json({ 
            message: 'Error generating overview report',
            error: (err as Error).message 
        });
    }
});

app.get('/api/reports/sales', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { start, end } = req.query;
        if (typeof start !== 'string' || typeof end !== 'string') {
            return res.status(400).json({ message: 'Start and end date queries are required.' });
        }

        const salesByDay = await db('orders')
            .whereBetween('created_at', [start, end])
            .select(db.raw("DATE(created_at) as date"))
            .sum('total_amount as total')
            .groupBy(db.raw("DATE(created_at)"))
            .orderBy('date', 'asc');

        const result = {
            salesByDay: salesByDay.map((day: any) => ({
                date: day.date,
                total: parseFloat(day.total || 0)
            }))
        };

        res.json(result);
    } catch (err) {
        console.error("Sales report error:", err);
        res.status(500).json({ 
            message: 'Error generating sales report',
            error: (err as Error).message 
        });
    }
});

app.get('/api/reports/inventory', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const lowStockItems = await db('inventory_items')
            .whereRaw('current_stock <= minimum_stock')
            .where('is_active', 1)
            .select('id', 'name', 'current_stock', 'minimum_stock')
            .orderBy('current_stock', 'asc');

        const totalValueResult = await db('inventory_items')
            .where('is_active', 1)
            .select(db.raw('SUM(current_stock * cost_per_unit) as total'))
            .first();

        const result = {
            lowStockItems: lowStockItems.map(item => ({
                id: item.id,
                name: item.name,
                current_stock: parseInt(item.current_stock || 0),
                minimum_stock: parseInt(item.minimum_stock || 0)
            })),
            totalValue: parseFloat((totalValueResult as any)?.total || 0)
        };

        res.json(result);
    } catch (err) {
        console.error("Inventory report error:", err);
        res.status(500).json({ 
            message: 'Error generating inventory report',
            error: (err as Error).message 
        });
    }
});

app.get('/api/reports/staff', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { start, end } = req.query;
        if (typeof start !== 'string' || typeof end !== 'string') {
            return res.status(400).json({ message: 'Start and end date queries are required.' });
        }

        const staffPerformance = await db('orders')
            .join('staff', 'orders.staff_id', 'staff.id')
            .whereBetween('orders.created_at', [start, end])
            .select('staff.name', 'staff.role')
            .count('orders.id as orders')
            .sum('orders.total_amount as revenue')
            .avg('orders.total_amount as avgOrderValue')
            .groupBy('staff.name', 'staff.role', 'staff.id')
            .orderBy('revenue', 'desc');

        const result = staffPerformance.map(staff => ({
            name: staff.name,
            role: staff.role,
            orders: parseInt(staff.orders || 0),
            revenue: parseFloat(staff.revenue || 0),
            avgOrderValue: parseFloat(staff.avgOrderValue || 0)
        }));

        res.json(result);
    } catch (err) {
        console.error("Staff report error:", err);
        res.status(500).json({ 
            message: 'Error generating staff report',
            error: (err as Error).message 
        });
    }
});

app.get('/api/reports/rooms', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { start, end } = req.query;
        if (typeof start !== 'string' || typeof end !== 'string') {
            return res.status(400).json({ message: 'Start and end date queries are required.' });
        }

        const roomRevenue = await db('orders')
            .where('order_type', 'room_service')
            .whereBetween('created_at', [start, end])
            .sum('total_amount as total')
            .first();

        const roomStatusCounts = await db('rooms')
            .select('status')
            .count('id as count')
            .groupBy('status')
            .orderBy('status', 'asc');

        const result = {
            roomRevenue: parseFloat((roomRevenue as any)?.total || 0),
            roomStatusCounts: roomStatusCounts.map(status => ({
                status: status.status,
                count: parseInt(String(status.count || 0))
            }))
        };

        res.json(result);
    } catch (err) {
        console.error("Room report error:", err);
        res.status(500).json({ 
            message: 'Error generating room report',
            error: (err as Error).message 
        });
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
      
      // Extract the ID properly handling both possible return types
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

// --- Start Server ---
server.listen(port, () => {
  console.log(`🚀 Backend server is running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
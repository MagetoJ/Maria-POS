import express from 'express';
import cors from 'cors';
import knex from 'knex';
import jwt from 'jsonwebtoken';
import http, { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { authenticateToken, authorizeRoles } from './middleware/auth';
const config = require('../knexfile');

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-and-secure-key-that-you-should-change';

const app = express();
const server = http.createServer(app);
const port = 3001;
const db = knex(config.default.development);

app.use(cors());
app.use(express.json());

// --- WebSocket Setup ---
const wss = new WebSocketServer({ server });
const kitchenSockets = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Simple routing based on URL path
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

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await db('staff').where({ username, is_active: true }).first();
    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ user: userWithoutPassword, token });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.post('/api/validate-pin', async (req, res) => {
  try {
    const { employeeId, pin } = req.body;
    if (!employeeId || !pin) {
      return res.status(400).json({ message: 'Employee ID and PIN are required' });
    }
    const user = await db('staff').where({ employee_id: employeeId, pin, is_active: true }).first();
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ message: 'Invalid Employee ID or PIN' });
    }
  } catch (err) {
    console.error('PIN validation error:', err);
    res.status(500).json({ message: 'Server error during PIN validation' });
  }
});


// --- PROTECTED API Endpoints ---

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

        // Notify kitchen displays of the new order
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


// Staff Management
app.get('/api/staff', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const staff = await db('staff').select('id', 'employee_id', 'username', 'name', 'role', 'pin', 'is_active', 'created_at');
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching staff' });
    }
});
app.post('/api/staff', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const [newStaff] = await db('staff').insert(req.body).returning('*');
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(500).json({ message: 'Error adding staff member' });
    }
});
app.put('/api/staff/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedStaff] = await db('staff').where({ id }).update(req.body).returning('*');
        res.json(updatedStaff);
    } catch (err) {
        res.status(500).json({ message: 'Error updating staff member' });
    }
});
app.delete('/api/staff/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        await db('staff').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting staff member' });
    }
});

// Product Management
app.get('/api/products', async (req, res) => {
    try {
        const products = await db('products').orderBy('name', 'asc');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});
app.post('/api/products', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const [newProduct] = await db('products').insert(req.body).returning('*');
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ message: 'Error adding product' });
    }
});
app.put('/api/products/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedProduct] = await db('products').where({ id }).update(req.body).returning('*');
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: 'Error updating product' });
    }
});
app.delete('/api/products/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        await db('products').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting product' });
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
        res.status(500).json({ message: 'Error fetching inventory' });
    }
});
app.post('/api/inventory', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const [newItem] = await db('inventory_items').insert(req.body).returning('*');
        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ message: 'Error adding inventory item' });
    }
});
app.put('/api/inventory/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedItem] = await db('inventory_items').where({ id }).update(req.body).returning('*');
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: 'Error updating inventory item' });
    }
});
app.delete('/api/inventory/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        await db('inventory_items').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Error deleting inventory item' });
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
// --- Maintenance Management ---
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
// --- Maintenance Request Management ---
app.put('/api/maintenance-requests/:id', authenticateToken, authorizeRoles('admin', 'manager', 'housekeeping'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedRequest] = await db('maintenance_requests').where({ id }).update(req.body).returning('*');
        res.json(updatedRequest);
    } catch (err) {
        res.status(500).json({ message: 'Error updating maintenance request' });
    }
});
// --- Delivery Management ---
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
// --- Settings Management ---
app.get('/api/settings', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const settingsArray = await db('settings').select('*');
        // Convert array to a key-value object
        const settingsObject = settingsArray.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
        res.json(settingsObject);
    } catch (err) {
        console.error("Error fetching settings:", err);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

app.put('/api/settings', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    const settings = req.body; // Expects an object like { business_name: 'New Name', ... }
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
        
        const query = db('orders').whereBetween('created_at', [start, end]);

        const sales = await query.clone().sum('total_amount as total').first();
        const orders = await query.clone().count('id as total').first();
        const completedOrders = await query.clone().where('status', 'completed').count('id as total').first();
        const avgOrderValue = await query.clone().avg('total_amount as avg').first();

        const topSellingItems = await db('order_items')
            .join('products', 'order_items.product_id', 'products.id')
            .join('orders', 'order_items.order_id', 'orders.id')
            .whereBetween('orders.created_at', [start, end])
            .select('products.name')
            .sum('order_items.quantity as quantity')
            .sum('order_items.total_price as revenue')
            .groupBy('products.name')
            .orderBy('revenue', 'desc')
            .limit(5);

        const topPerformers = await db('orders')
            .join('staff', 'orders.staff_id', 'staff.id')
            .whereBetween('orders.created_at', [start, end])
            .select('staff.name')
            .count('orders.id as orders')
            .sum('orders.total_amount as revenue')
            .groupBy('staff.name')
            .orderBy('revenue', 'desc')
            .limit(4);

        res.json({
            sales: { monthly: (sales as any)?.total || 0 },
            orders: {
                total: (orders as any)?.total || 0,
                completed: (completedOrders as any)?.total || 0,
                averageValue: (avgOrderValue as any)?.avg || 0,
            },
            inventory: { topSellingItems },
            staff: { topPerformers }
        });
    } catch (err) {
        console.error("Report generation error:", err);
        res.status(500).json({ message: 'Error generating report' });
    }
});

app.get('/api/reports/:reportType', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { reportType } = req.params;
        const { start, end } = req.query;

        if (typeof start !== 'string' || typeof end !== 'string') {
            return res.status(400).json({ message: 'Start and end date queries are required.' });
        }

        let data;

        switch (reportType) {
            case 'sales':
                const salesByDay = await db('orders')
                    .whereBetween('created_at', [start, end])
                    .select(db.raw("strftime('%Y-%m-%d', created_at) as date"))
                    .sum('total_amount as total')
                    .groupBy('date')
                    .orderBy('date');
                data = { salesByDay };
                break;
            case 'inventory':
                 const lowStockItems = await db('inventory_items')
                    .whereRaw('current_stock <= minimum_stock')
                    .select('*');
                 const totalValue = await db('inventory_items').sum(db.raw('current_stock * cost_per_unit as total')).first();
                 data = { lowStockItems, totalValue: (totalValue as any)?.total || 0 };
                break;
            case 'staff':
                data = await db('orders')
                    .join('staff', 'orders.staff_id', 'staff.id')
                    .whereBetween('orders.created_at', [start, end])
                    .select('staff.name', 'staff.role')
                    .count('orders.id as orders')
                    .sum('orders.total_amount as revenue')
                    .avg('orders.total_amount as avgOrderValue')
                    .groupBy('staff.name', 'staff.role')
                    .orderBy('revenue', 'desc');
                break;
            case 'rooms':
                const roomRevenue = await db('orders')
                    .where('order_type', 'room_service')
                    .whereBetween('created_at', [start, end])
                    .sum('total_amount as total').first();
                const roomStatusCounts = await db('rooms').select('status').count('id as count').groupBy('status');
                data = { roomRevenue: (roomRevenue as any)?.total || 0, roomStatusCounts };
                break;
            default:
                return res.status(404).json({ message: 'Report type not found' });
        }
        res.json(data);
    } catch (err) {
        console.error(`Error generating ${req.params.reportType} report:`, err);
        res.status(500).json({ message: 'Error generating report' });
    }
});


// --- Start Server ---
server.listen(port, () => {
  console.log(`🚀 Backend server is running at http://localhost:${port}`);
});


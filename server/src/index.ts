import express from 'express';
import cors from 'cors';
import knex from 'knex';
const config = require('../knexfile');

// Initialize Express app
const app = express();
const port = 3001;

// Initialize database connection
// FIX: Access the 'development' config from the 'default' export
const db = knex(config.default.development);

// Middleware
app.use(cors());
app.use(express.json());

// --- API Endpoints ---

// ✅ GET all active categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db('categories')
      .where({ is_active: true })
      .orderBy('id', 'asc');
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// ✅ GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db('products').select('*');
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// ✅ GET all tables
app.get('/api/tables', async (req, res) => {
  try {
    const tables = await db('tables').select('*').orderBy('table_number', 'asc');
    res.json(tables);
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).json({ message: 'Error fetching tables' });
  }
});

// ✅ GET all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await db('rooms').select('*').orderBy('room_number', 'asc');
    res.json(rooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

// 🆕 POST to create a new order
app.post('/api/orders', async (req, res) => {
    const { order, payment } = req.body;

    if (!order || !order.items || order.items.length === 0 || !payment) {
        return res.status(400).json({ message: 'Invalid order data provided.' });
    }

    const trx = await db.transaction();
    try {
        const [orderResult] = await trx('orders').insert({
            order_number: `ORD-${Date.now()}`,
            order_type: order.order_type,
            staff_id: payment.staff_id,
            status: 'completed',
            subtotal: order.subtotal,
            tax_amount: order.tax_amount,
            service_charge: order.service_charge,
            discount_amount: order.discount_amount,
            total_amount: order.total_amount,
            payment_status: 'paid',
            table_id: order.table_id,
            room_id: order.room_id,
            notes: order.notes,
        }).returning('id');

        const orderId = typeof orderResult === 'number' ? orderResult : orderResult.id;

        const itemsToInsert = order.items.map((item: any) => ({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            notes: item.notes,
        }));

        if (itemsToInsert.length > 0) {
            await trx('order_items').insert(itemsToInsert);
        }
        
        await trx('payments').insert({
            order_id: orderId,
            payment_method: payment.payment_method,
            amount: order.total_amount,
            status: 'completed',
        });
        
        await trx.commit();
        
        res.status(201).json({ success: true, orderId: orderId });

    } catch (err) {
        await trx.rollback();
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Error creating order' });
    }
});


// ✅ POST Login with username and password
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await db('staff')
      .where({ username: username, is_active: true })
      .first();

    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ✅ POST Validate staff PIN
app.post('/api/validate-pin', async (req, res) => {
  try {
    const { employeeId, pin } = req.body;
    if (!employeeId || !pin) {
      return res.status(400).json({ message: 'Employee ID and PIN are required' });
    }

    const user = await db('staff')
      .where({ employee_id: employeeId, pin: pin, is_active: true })
      .first();

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

// --- Start Server ---
app.listen(port, () => {
  console.log(`🚀 Backend server is running at http://localhost:${port}`);
});


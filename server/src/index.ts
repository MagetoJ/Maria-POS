import express from 'express';
import cors from 'cors';
import knex from 'knex';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeRoles } from './middleware/auth';
const config = require('../knexfile');

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-and-secure-key-that-you-should-change';

const app = express();
const port = 3001;
const db = knex(config.default.development);

app.use(cors());
app.use(express.json());

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
        const products = await db('products').where({ is_active: true }).orderBy('name', 'asc');
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
        const categories = await db('categories').where({ is_active: true }).orderBy('display_order', 'asc');
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
app.put('/api/rooms/:id', authenticateToken, authorizeRoles('admin', 'manager', 'receptionist', 'housekeeping'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedRoom] = await db('rooms').where({ id }).update(req.body).returning('*');
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).json({ message: 'Error updating room' });
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
app.put('/api/tables/:id', authenticateToken, authorizeRoles('admin', 'manager', 'waiter'), async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedTable] = await db('tables').where({ id }).update(req.body).returning('*');
        res.json(updatedTable);
    } catch (err) {
        res.status(500).json({ message: 'Error updating table' });
    }
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`🚀 Backend server is running at http://localhost:${port}`);
});
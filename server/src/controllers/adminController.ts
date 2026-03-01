import { Request, Response } from 'express';
import db from '../db';

// Get active users (logged in within last 24 hours)
export const getActiveUsers = async (req: Request, res: Response) => {
  try {
    const activeUsers = await db('user_sessions as us')
      .join('staff as s', 'us.user_id', 's.id')
      .select(
        's.id',
        's.name',
        's.role',
        'us.login_time'
      )
      .where('us.is_active', true)
      .where('us.login_time', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .orderBy('us.login_time', 'desc');

    res.json(activeUsers);
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user sessions (both active and recent inactive)
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    // First, clean up stale sessions (older than 8 hours with no logout)
    const staleSessionCutoff = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours ago
    await db('user_sessions')
      .where('is_active', true)
      .where('login_time', '<', staleSessionCutoff)
      .whereNull('logout_time')
      .update({
        is_active: false,
        logout_time: new Date(),
        updated_at: new Date()
      });

    // Get latest session for each user within the last 24 hours
    const userSessions = await db('user_sessions as us')
      .join('staff as s', 'us.user_id', 's.id')
      .select(
        's.id as staff_id',
        's.name',
        's.role',
        'us.login_time',
        'us.logout_time',
        'us.is_active'
      )
      .where('us.login_time', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .whereIn('us.id', function() {
        this.select(db.raw('MAX(id)'))
          .from('user_sessions')
          .where('login_time', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
          .groupBy('user_id');
      })
      .orderBy('us.login_time', 'desc');

    res.json(userSessions);
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get low stock alerts
export const getLowStockAlerts = async (req: Request, res: Response) => {
  try {
    const lowStockItems = await db('inventory_items')
      .select('id', 'name', 'current_stock', 'minimum_stock', 'inventory_type', 'unit')
      .whereRaw('current_stock <= minimum_stock')
      .where('is_active', true)
      .orderBy('inventory_type')
      .orderBy('name');

    res.json(lowStockItems);
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user session history (optional - for more detailed session tracking)
export const getUserSessionHistory = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const sessions = await db('user_sessions as us')
      .join('staff as s', 'us.user_id', 's.id')
      .select(
        'us.id',
        's.name',
        's.username',
        's.role',
        'us.login_time',
        'us.logout_time',
        'us.is_active'
      )
      .orderBy('us.login_time', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const totalCount = await db('user_sessions').count('id as count').first();

    res.json({
      sessions,
      totalCount: parseInt(totalCount?.count as string) || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Get user session history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Clear previous days data (End of Day / Cash Up)
export const clearPreviousData = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await db.transaction(async (trx) => {
      // Record clearance for each unique staff member with uncleared data
      const staffWithUnclearedData = await trx('orders')
        .where('is_cleared', false)
        .select('staff_id')
        .groupBy('staff_id');

      for (const { staff_id } of staffWithUnclearedData) {
        const summary = await trx('orders')
          .where('staff_id', staff_id)
          .where('is_cleared', false)
          .sum('total_amount as total')
          .first();

        await trx('waiter_clearances').insert({
          staff_id,
          cleared_by: adminId,
          cleared_at: new Date(),
          total_amount_cleared: summary?.total || 0,
          notes: 'Clear All Previous Data action'
        });
      }

      // Clear orders
      await trx('orders')
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });

      // Clear expenses
      await trx('expenses')
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });

      // Clear room transactions
      await trx('room_transactions')
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });
    });

    res.json({ message: 'Previous data cleared successfully' });
  } catch (error) {
    console.error('Clear previous data error:', error);
    res.status(500).json({ message: 'Failed to clear previous data' });
  }
};

// Clear specific staff member's previous data
export const clearStaffData = async (req: Request, res: Response) => {
  try {
    const { id: staffIdToClear } = req.params;
    const adminId = (req as any).user?.id;

    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await db.transaction(async (trx) => {
      // 1. Calculate total before clearing
      const summary = await trx('orders')
        .where('staff_id', staffIdToClear)
        .where('is_cleared', false)
        .sum('total_amount as total')
        .first();

      // 2. Get staff name
      const staff = await trx('staff')
        .where('id', staffIdToClear)
        .select('name')
        .first();

      // 3. Record in waiter_clearances
      await trx('waiter_clearances').insert({
        staff_id: staffIdToClear,
        cleared_by: adminId,
        cleared_at: new Date(),
        total_amount_cleared: summary?.total || 0,
        notes: `Individual clearance for ${staff?.name || 'staff'}`
      });

      // 4. Update all pending records
      await trx('orders')
        .where('staff_id', staffIdToClear)
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });
        
      // Also clear expenses if applicable
      await trx('expenses')
        .where('created_by', staffIdToClear)
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });

      // Also clear room transactions if applicable
      await trx('room_transactions')
        .where('staff_id', staffIdToClear)
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });

      return {
        staffName: staff?.name || 'Unknown',
        totalAmount: summary?.total || 0
      };
    });

    res.json({ 
      message: `Data for staff ${result.staffName} cleared successfully`,
      staffName: result.staffName,
      totalAmount: result.totalAmount
    });
  } catch (error) {
    console.error('Clear staff data error:', error);
    res.status(500).json({ message: 'Failed to clear staff data' });
  }
};

// Get specific uncleared receipts for a staff member
export const getUnclearedStaffReceipts = async (req: Request, res: Response) => {
  try {
    const { id: staffId } = req.params;
    const { start, end, includeCleared } = req.query;
    const currentUser = (req as any).user;

    // Waiters can ONLY see their own receipts
    if (currentUser.role === 'waiter' && currentUser.id !== parseInt(staffId)) {
      return res.status(403).json({ message: 'Access denied: You can only view your own receipts' });
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Get Orders
    let ordersQuery = db('orders').where('staff_id', staffId);
    if (includeCleared !== 'true') {
      ordersQuery = ordersQuery.where('is_cleared', false);
    }
    if (start && end) {
      ordersQuery = ordersQuery.whereBetween('created_at', [start as string, end as string]);
    }
    const orders = await ordersQuery.select('*').orderBy('created_at', 'desc');

    // 2. Get Expenses (formatted as pseudo-receipts)
    let expensesQuery = db('expenses').where('created_by', staffId);
    if (includeCleared !== 'true') {
      expensesQuery = expensesQuery.where('is_cleared', false);
    }
    if (start && end) {
      expensesQuery = expensesQuery.whereBetween('created_at', [start as string, end as string]);
    }
    const expenses = await expensesQuery.select('*').orderBy('created_at', 'desc');

    // 3. Get Room Transactions (formatted as pseudo-receipts)
    let roomsQuery = db('room_transactions').where('staff_id', staffId);
    if (includeCleared !== 'true') {
      roomsQuery = roomsQuery.where('is_cleared', false);
    }
    if (start && end) {
      roomsQuery = roomsQuery.whereBetween('created_at', [start as string, end as string]);
    }
    const rooms = await roomsQuery.select('*').orderBy('created_at', 'desc');

    // Map everything to a consistent format for the frontend
    const orderReceipts = orders.map(o => ({ ...o, items: [] })); // Items added later
    
    const expenseReceipts = expenses.map(e => ({
      id: -e.id, // Negative ID to avoid collision with orders
      order_number: `EXP-${e.receipt_number || e.id}`,
      order_type: 'expense',
      total_amount: e.amount,
      payment_method: e.payment_method || 'cash',
      status: 'completed',
      created_at: e.created_at,
      is_cleared: e.is_cleared,
      items: [{
        id: e.id,
        product_name: `Expense: ${e.category} - ${e.description}`,
        quantity: 1,
        unit_price: e.amount,
        total_price: e.amount
      }]
    }));

    const roomReceipts = rooms.map(r => ({
      id: -(r.id + 1000000), // Avoid collision
      order_number: `ROOM-${r.id}`,
      order_type: 'room_service',
      total_amount: r.total_amount || r.total_price || 0,
      payment_method: 'room_charge',
      status: r.status === 'completed' ? 'completed' : 'pending',
      created_at: r.created_at,
      is_cleared: r.is_cleared,
      items: [{
        id: r.id,
        product_name: `Room #${r.room_id} - ${r.guest_name}`,
        quantity: r.nights || 1,
        unit_price: r.rate_at_time || 0,
        total_price: r.total_amount || r.total_price || 0
      }]
    }));

    // Combine all
    let allReceipts = [...orderReceipts, ...expenseReceipts, ...roomReceipts];
    
    // Sort by date
    allReceipts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (allReceipts.length === 0) {
      return res.json([]);
    }

    // Get order items for the actual orders
    const actualOrderIds = orders.map(o => o.id);
    if (actualOrderIds.length > 0) {
      const allItems = await db('order_items')
        .leftJoin('products', 'order_items.product_id', 'products.id')
        .whereIn('order_id', actualOrderIds)
        .select(
          'order_items.*',
          'products.name as product_name'
        );

      const itemsByOrder = allItems.reduce((acc: any, item: any) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});

      // Update the items for actual orders in allReceipts
      allReceipts = allReceipts.map(receipt => {
        if (receipt.id > 0) {
          return { ...receipt, items: itemsByOrder[receipt.id] || [] };
        }
        return receipt;
      });
    }

    res.json(allReceipts);
  } catch (error: any) {
    console.error('Get uncleared staff receipts error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch uncleared staff receipts',
      error: error.message 
    });
  }
};

// Get uncleared staff summary
export const getUnclearedStaffSummary = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Simplified query to find all staff who have uncleared data in ANY table
    const ordersQuery = db('orders').where('is_cleared', false).select('staff_id as id', 'total_amount as amount', db.raw("'order' as type"));
    const expensesQuery = db('expenses').where('is_cleared', false).select('created_by as id', 'amount', db.raw("'expense' as type"));
    const roomsQuery = db('room_transactions').where('is_cleared', false).select('staff_id as id', 'total_amount as amount', db.raw("'room' as type"));

    let combinedQuery = db.union([ordersQuery, expensesQuery, roomsQuery], true);
    
    // Wrap in a subquery to join with staff details
    const unclearedStaff = await db.select('s.id', 's.name', 's.employee_id', 's.role')
      .from('staff as s')
      .join(combinedQuery.as('u'), 's.id', 'u.id')
      .select(db.raw('COUNT(*) as uncleared_count'))
      .select(db.raw('SUM(COALESCE(u.amount, 0)) as total_due'))
      .where(function() {
        if (currentUser.role === 'waiter') {
          this.where('s.id', currentUser.id);
        }
      })
      .groupBy('s.id', 's.name', 's.employee_id', 's.role');

    res.json(unclearedStaff);
  } catch (error: any) {
    console.error('Get uncleared staff summary error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch uncleared staff summary',
      error: error.message 
    });
  }
};

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
    const staffId = (req as any).user?.id;
    if (!staffId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await db.transaction(async (trx) => {
      // Clear orders
      await trx('orders')
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: staffId
        });

      // Clear expenses
      await trx('expenses')
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: staffId
        });

      // Clear room transactions
      await trx('room_transactions')
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: staffId
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

      // 3. Update all pending records
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

    let query = db('orders')
      .where('staff_id', staffId);

    // Filter by clearing status if specified
    if (includeCleared === 'true') {
      // Show everything (both cleared and uncleared)
    } else {
      query = query.where('is_cleared', false);
    }

    // If dates are provided, use them. Otherwise default to all uncleared
    if (start && end) {
      query = query.whereBetween('created_at', [start as string, end as string]);
    } else if (includeCleared !== 'true') {
      // If not including cleared, we already have .where('is_cleared', false) implicitly or explicitly
      // No additional date constraint needed to show all currently uncleared
    }

    const receipts = await query.select('*').orderBy('created_at', 'desc');

    if (receipts.length === 0) {
      return res.json([]);
    }

    const receiptIds = receipts.map(r => r.id);

    // Get order items for these receipts
    const allItems = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .whereIn('order_id', receiptIds)
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

    // Attach items to receipts
    const receiptsWithItems = receipts.map(receipt => ({
      ...receipt,
      items: itemsByOrder[receipt.id] || []
    }));

    res.json(receiptsWithItems);
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

    let query = db('orders')
      .join('staff', 'orders.staff_id', 'staff.id')
      .where('orders.is_cleared', false);

    // Filter by staff_id if the user is a waiter
    if (currentUser.role === 'waiter') {
      query = query.where('staff.id', currentUser.id);
    }

    const unclearedSummary = await query
      .select(
        'staff.id',
        'staff.name',
        'staff.employee_id',
        'staff.role'
      )
      .select(db.raw('COUNT(orders.id) as uncleared_count'))
      .select(db.raw('SUM(COALESCE(orders.total_amount, 0)) as total_due'))
      .groupBy('staff.id', 'staff.name', 'staff.employee_id', 'staff.role');

    res.json(unclearedSummary);
  } catch (error: any) {
    console.error('Get uncleared staff summary error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch uncleared staff summary',
      error: error.message 
    });
  }
};

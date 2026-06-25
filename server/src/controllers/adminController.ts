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

// Clear previous days data (End of Day / Cash Up / Bulk Rollover)
// REQUIRES explicit { "confirm": true } in the request body to prevent accidental triggers.
export const clearPreviousData = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Safety guard: caller must explicitly pass { confirm: true } in the body.
    if (req.body?.confirm !== true) {
      return res.status(400).json({ message: 'Explicit confirmation required. Pass { "confirm": true } in the request body.' });
    }

    // Kenyan 8 AM Rollover Logic (8 AM EAT = 11 AM UTC)
    const anchorUTC = new Date();
    anchorUTC.setUTCHours(11, 0, 0, 0);
    
    // If current time is before 8 AM EAT, the previous shift work window ended at yesterday's 8 AM anchor.
    if (new Date() < anchorUTC) {
      anchorUTC.setUTCDate(anchorUTC.getUTCDate() - 1);
    }

    // Runtime Safety: Check if completed_by column exists inside the table schema
    const hasCompletedBy = await db.schema.hasColumn('orders', 'completed_by');

    await db.transaction(async (trx) => {
      // Record clearance for each unique staff member who has uncleared data created BEFORE the 8 AM cutoff
      // Safely toggle completed_by sub-selection inside the union subquery based on runtime schema state
      const orderSelectionSQL = hasCompletedBy
        ? 'SELECT staff_id FROM orders WHERE is_cleared = false AND created_at < ? UNION SELECT completed_by as staff_id FROM orders WHERE is_cleared = false AND created_at < ?'
        : 'SELECT staff_id FROM orders WHERE is_cleared = false AND created_at < ?';

      const rawBindings = hasCompletedBy
        ? [anchorUTC, anchorUTC, anchorUTC, anchorUTC, anchorUTC]
        : [anchorUTC, anchorUTC, anchorUTC];

      const staffWithUnclearedData = await trx.raw(`
        SELECT staff_id FROM (
          ${orderSelectionSQL}
          UNION
          SELECT created_by as staff_id FROM expenses WHERE is_cleared = false AND created_at < ?
          UNION
          SELECT staff_id FROM room_transactions WHERE is_cleared = false AND created_at < ?
        ) as combined WHERE staff_id IS NOT NULL GROUP BY staff_id
      `, rawBindings);

      const targetStaff = staffWithUnclearedData.rows || staffWithUnclearedData;

      for (const { staff_id } of targetStaff) {
        const orderSum = await trx('orders')
          .where({ is_cleared: false })
          .andWhere('created_at', '<', anchorUTC)
          .where(function() {
            if (hasCompletedBy) {
              this.where('staff_id', staff_id).orWhere('completed_by', staff_id);
            } else {
              this.where('staff_id', staff_id);
            }
          })
          .sum('total_amount as total')
          .first();

        const roomSum = await trx('room_transactions').where({ staff_id, is_cleared: false }).andWhere('created_at', '<', anchorUTC).sum('total_amount as total').first();
        const expenseSum = await trx('expenses').where({ created_by: staff_id, is_cleared: false }).andWhere('created_at', '<', anchorUTC).sum('amount as total').first();

        const totalToClear = (Number(orderSum?.total) || 0) + (Number(roomSum?.total) || 0) - (Number(expenseSum?.total) || 0);

        await trx('waiter_clearances').insert({
          staff_id,
          cleared_by: adminId,
          cleared_at: new Date(),
          total_amount_cleared: totalToClear,
          notes: `Bulk rollover clearance for previous shifts (Cutoff: ${anchorUTC.toISOString()})`
        });
      }

      // Clear orders older than the 8 AM rollover point matching either order-ownership field
      await trx('orders')
        .where('is_cleared', false)
        .andWhere('created_at', '<', anchorUTC)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });

      // Clear expenses older than the 8 AM rollover point
      await trx('expenses')
        .where('is_cleared', false)
        .andWhere('created_at', '<', anchorUTC)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });

      // Clear room transactions older than the 8 AM rollover point
      await trx('room_transactions')
        .where('is_cleared', false)
        .andWhere('created_at', '<', anchorUTC)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });
    });

    res.json({ message: 'Previous shift data cleared successfully. Active shift data preserved.' });
  } catch (error) {
    console.error('Clear previous data error:', error);
    res.status(500).json({ message: 'Failed to clear previous data' });
  }
};

// Clear specific staff member's total outstanding balance on demand (Individual Clear Button)
export const clearStaffData = async (req: Request, res: Response) => {
  try {
    const { id: staffIdToClear } = req.params;
    const adminId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Enforce that only admins or managers can trigger clearing functions
    if (!adminId || (userRole !== 'admin' && userRole !== 'manager')) {
      return res.status(403).json({ message: 'Access denied: Only Admins or Managers can execute waiter clearances.' });
    }

    // Runtime Safety: Check if completed_by exists before compiling subqueries
    const hasCompletedBy = await db.schema.hasColumn('orders', 'completed_by');

    const result = await db.transaction(async (trx) => {
      // Calculate active running balance
      const orderSum = await trx('orders')
        .where('is_cleared', false)
        .where('status', 'completed')
        .where(function() {
          if (hasCompletedBy) {
            this.where('staff_id', staffIdToClear).orWhere('completed_by', staffIdToClear);
          } else {
            this.where('staff_id', staffIdToClear);
          }
        })
        .sum('total_amount as total').first();

      const roomSum = await trx('room_transactions').where({ staff_id: staffIdToClear, is_cleared: false }).sum('total_amount as total').first();
      const expenseSum = await trx('expenses').where({ created_by: staffIdToClear, is_cleared: false }).sum('amount as total').first();

      const totalNet = (Number(orderSum?.total) || 0) + (Number(roomSum?.total) || 0) - (Number(expenseSum?.total) || 0);

      // Get staff name
      const staff = await trx('staff')
        .where('id', staffIdToClear)
        .select('name')
        .first();

      // Record entry inside clearance trace logs
      await trx('waiter_clearances').insert({
        staff_id: staffIdToClear,
        cleared_by: adminId,
        cleared_at: trx.fn.now(),
        total_amount_cleared: totalNet,
        notes: `Individual clearance for ${staff?.name || 'staff'} completed by Admin`
      });

      // Update all matching completed orders to true
      await trx('orders')
        .where('is_cleared', false)
        .where('status', 'completed')
        .where(function() {
          if (hasCompletedBy) {
            this.where('staff_id', staffIdToClear).orWhere('completed_by', staffIdToClear);
          } else {
            this.where('staff_id', staffIdToClear);
          }
        })
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });
        
      await trx('expenses')
        .where('created_by', staffIdToClear)
        .where('is_cleared', false)
        .update({
          is_cleared: true,
          cleared_at: new Date(),
          cleared_by: adminId
        });

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
        totalAmount: totalNet
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

    // Runtime Safety mapping token
    const hasCompletedBy = await db.schema.hasColumn('orders', 'completed_by');

    // 1. Get Orders matching either standard staff allocation or completed token if column exists
    let ordersQuery = db('orders').where(function() {
      if (hasCompletedBy) {
        this.where('staff_id', staffId).orWhere('completed_by', staffId);
      } else {
        this.where('staff_id', staffId);
      }
    });

    if (includeCleared === 'true') {
      ordersQuery = ordersQuery.where('is_cleared', true);
      if (start && end) {
        ordersQuery = ordersQuery.whereBetween('created_at', [start as string, end as string]);
      }
    } else {
      ordersQuery = ordersQuery.where('is_cleared', false);
    }
    const orders = await ordersQuery.select('*').orderBy('created_at', 'desc');

    // 2. Get Expenses (formatted as pseudo-receipts)
    let expensesQuery = db('expenses').where('created_by', staffId);
    if (includeCleared === 'true') {
      expensesQuery = expensesQuery.where('is_cleared', true);
      if (start && end) {
        expensesQuery = expensesQuery.whereBetween('created_at', [start as string, end as string]);
      }
    } else {
      expensesQuery = expensesQuery.where('is_cleared', false);
    }
    const expenses = await expensesQuery.select('*').orderBy('created_at', 'desc');

    // 3. Get Room Transactions (formatted as pseudo-receipts)
    let roomsQuery = db('room_transactions').where('staff_id', staffId);
    if (includeCleared === 'true') {
      roomsQuery = roomsQuery.where('is_cleared', true);
      if (start && end) {
        roomsQuery = roomsQuery.whereBetween('created_at', [start as string, end as string]);
      }
    } else {
      roomsQuery = roomsQuery.where('is_cleared', false);
    }
    const rooms = await roomsQuery.select('*').orderBy('created_at', 'desc');

    // Map everything to a consistent format for the frontend
    const orderReceipts = orders.map(o => ({ ...o, items: [] }));
    
    const expenseReceipts = expenses.map(e => ({
      id: -e.id,
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
      id: -(r.id + 1000000),
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

    // Combine all datasets
    let allReceipts = [...orderReceipts, ...expenseReceipts, ...roomReceipts];
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

      // Inject compiled items back into order shells
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

// --- Access Requests Functionality ---

// Get all pending access requests (for Admin)
export const getAccessRequests = async (req: Request, res: Response) => {
  try {
    const requests = await db('access_requests as ar')
      .join('staff as s', 'ar.staff_id', 's.id')
      .select(
        'ar.*',
        's.name as staff_name',
        's.role as staff_role'
      )
      .where('ar.status', 'pending')
      .orderBy('ar.created_at', 'desc');

    res.json(requests);
  } catch (error) {
    console.error('Get access requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new access request (for Waiter)
export const createAccessRequest = async (req: Request, res: Response) => {
  try {
    const { request_type, notes } = req.body;
    const staff_id = (req as any).user?.id;

    if (!request_type) {
      return res.status(400).json({ message: 'Request type is required' });
    }

    // Check if there's already a pending request of this type for this user
    const existing = await db('access_requests')
      .where({ staff_id, request_type, status: 'pending' })
      .first();

    if (existing) {
      return res.status(400).json({ message: 'You already have a pending request for this action' });
    }

    const [id] = await db('access_requests').insert({
      staff_id,
      request_type,
      notes,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');

    res.status(201).json({ id, message: 'Request submitted successfully. Please wait for admin approval.' });
  } catch (error) {
    console.error('Create access request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Handle access request (Approve/Deny)
export const handleAccessRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'denied'
    const admin_id = (req as any).user?.id;

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await db('access_requests').where({ id }).first();
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await db('access_requests').where({ id }).update({
      status,
      approved_by: admin_id,
      approved_at: status === 'approved' ? new Date() : null,
      notes: notes || request.notes,
      updated_at: new Date()
    });

    res.json({ message: `Request ${status} successfully` });
  } catch (error) {
    console.error('Handle access request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check status of a request (for Frontend polling or check)
export const checkRequestStatus = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const staff_id = (req as any).user?.id;

    const request = await db('access_requests')
      .where({ staff_id, request_type: type, status: 'approved' })
      .where('updated_at', '>', new Date(Date.now() - 30 * 60 * 1000)) // Approved in last 30 mins
      .orderBy('updated_at', 'desc')
      .first();

    res.json({ approved: !!request, request });
  } catch (error) {
    console.error('Check request status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get uncleared staff summary
export const getUnclearedStaffSummary = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Runtime Check: Verify if completed_by column exists before using it inside the raw Knex COALESCE string
    const hasCompletedBy = await db.schema.hasColumn('orders', 'completed_by');
    const orderIdSelection = hasCompletedBy ? 'COALESCE(staff_id, completed_by) as staff_id' : 'staff_id';

    // Build structured derived subquery table
    const combinedTransactions = db('orders')
      .where('is_cleared', false)
      .where('status', 'completed')
      .select(
        db.raw(orderIdSelection),
        'total_amount',
        db.raw("'order' as type")
      )
      .unionAll([
        db('expenses')
          .where('is_cleared', false)
          .select('created_by as staff_id', db.raw('(amount * -1) as total_amount'), db.raw("'expense' as type")),
        db('room_transactions')
          .where('is_cleared', false)
          .select('staff_id', 'total_amount', db.raw("'room' as type"))
      ])
      .as('u');
    
    // Join staff table with the combined transactions to ensure all waiters appear
    const staffSummary = await db('staff as s')
      .leftJoin(combinedTransactions, 's.id', 'u.staff_id')
      .select(
        's.id', 
        's.name', 
        's.employee_id', 
        's.role',
        db.raw('COUNT(u.type) as uncleared_count'), // Count actual records, not staff rows
        db.raw('SUM(COALESCE(u.total_amount, 0)) as total_due')
      )
      .where(function() {
        // Always show all active waiters
        this.where(function() {
          this.where('s.role', 'waiter').andWhere('s.is_active', true);
        });
        
        // plus any other staff member (active or not) that happens to have uncleared data
        if (currentUser.role !== 'waiter') {
          this.orWhereNotNull('u.staff_id'); 
        }
      })
      .modify((queryBuilder) => {
        if (currentUser.role === 'waiter') {
          queryBuilder.where('s.id', currentUser.id);
        }
      })
      .groupBy('s.id', 's.name', 's.employee_id', 's.role')
      .orderBy('s.name', 'asc');

    res.json(staffSummary);
  } catch (error: any) {
    console.error('Get uncleared staff summary error:', error);
    res.status(500).json({ message: 'Failed to fetch staff summary', error: error.message });
  }
};
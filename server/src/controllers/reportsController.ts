import { Request, Response } from 'express';
import db from '../db';

// Get personal sales report for a specific staff member
export const getPersonalSales = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const queryDate = date || new Date().toISOString().split('T')[0];

    // Get personal sales for the specific date
    const salesData = await db('orders')
      .join('staff', 'orders.staff_id', 'staff.id')
      .where('orders.staff_id', userId)
      .whereBetween('orders.created_at', [
        `${queryDate} 00:00:00`,
        `${queryDate} 23:59:59`
      ])
      .select(
        'staff.id as staff_id',
        'staff.name as staff_name',
        'staff.role as staff_role'
      )
      .select(db.raw('DATE(orders.created_at) as sales_date'))
      .select(db.raw('COUNT(orders.id) as total_orders'))
      .select(db.raw('COALESCE(SUM(orders.total_amount), 0) as total_sales'))
      .select(db.raw('COALESCE(SUM(orders.service_charge), 0) as total_service_charge'))
      .groupBy('staff.id', 'staff.name', 'staff.role')
      .groupBy(db.raw('DATE(orders.created_at)'))
      .first();

    if (!salesData) {
      // Return empty data structure if no sales found
      const user = await db('staff').where('id', userId).first();
      return res.json({
        staff_id: userId,
        staff_name: user?.name || 'Unknown',
        staff_role: user?.role || 'Unknown',
        sales_date: queryDate,
        total_orders: 0,
        total_sales: 0,
        total_service_charge: 0
      });
    }

    res.json(salesData);
  } catch (error) {
    console.error('Personal sales report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get waiter sales report (for receptionist/admin/manager)
export const getWaiterSales = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const userRole = req.user?.role;

    // Check if user has permission to view waiter sales
    if (!['receptionist', 'admin', 'manager'].includes(userRole || '')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const queryDate = date || new Date().toISOString().split('T')[0];

    // Get all waiter sales for the specific date
    const waiterSalesData = await db('orders')
      .join('staff', 'orders.staff_id', 'staff.id')
      .where('staff.role', 'waiter')
      .whereBetween('orders.created_at', [
        `${queryDate} 00:00:00`,
        `${queryDate} 23:59:59`
      ])
      .select(
        'staff.id as staff_id',
        'staff.name as staff_name',
        'staff.role as staff_role'
      )
      .select(db.raw('DATE(orders.created_at) as sales_date'))
      .select(db.raw('COUNT(orders.id) as total_orders'))
      .select(db.raw('COALESCE(SUM(orders.total_amount), 0) as total_sales'))
      .select(db.raw('COALESCE(SUM(orders.service_charge), 0) as total_service_charge'))
      .groupBy('staff.id', 'staff.name', 'staff.role')
      .groupBy(db.raw('DATE(orders.created_at)'))
      .orderBy('total_sales', 'desc');

    res.json(waiterSalesData);
  } catch (error) {
    console.error('Waiter sales report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get overview report
export const getOverviewReport = async (req: Request, res: Response) => {
  try {
    console.log('🚀 Starting overview report request...');
    const { start, end } = req.query;
    
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end || new Date().toISOString().split('T')[0];

    console.log('📅 Overview report - Date range:', { startDate, endDate });
    
    // Test database connection first
    console.log('🔌 Testing database connection...');
    try {
      await db.raw('SELECT 1');
      console.log('✅ Database connection successful');
    } catch (error) {
      const dbError = error as Error;
      console.error('❌ Database connection failed:', dbError);
      return res.status(500).json({ message: 'Database connection error', error: dbError.message });
    }

    // Get sales overview
    console.log('📊 Fetching sales overview...');
    let salesOverview;
    try {
      salesOverview = await db('orders')
        .whereBetween('created_at', [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
        .select(
          db.raw('COUNT(*) as total_orders'),
          db.raw('COALESCE(SUM(total_amount), 0) as total_revenue'),
          db.raw('COALESCE(SUM(service_charge), 0) as total_service_charge'),
          db.raw('COALESCE(AVG(total_amount), 0) as average_order_value')
        )
        .first();
      console.log('✅ Sales overview result:', salesOverview);
    } catch (error) {
      const salesError = error as Error;
      console.error('❌ Sales overview query failed:', salesError);
      return res.status(500).json({ message: 'Sales overview query error', error: salesError.message });
    }

    // Get top performing staff
    console.log('👥 Fetching top staff...');
    let topStaff: any[] = [];
    try {
      topStaff = await db('orders')
        .join('staff', 'orders.staff_id', 'staff.id')
        .whereBetween('orders.created_at', [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
        .select(
          'staff.name',
          'staff.role',
          db.raw('COUNT(orders.id) as order_count'),
          db.raw('COALESCE(SUM(orders.total_amount), 0) as total_sales')
        )
        .groupBy('staff.id', 'staff.name', 'staff.role')
        .orderBy('total_sales', 'desc')
        .limit(5);
      console.log('✅ Top staff result:', topStaff);
    } catch (staffError) {
      console.error('❌ Top staff query failed:', staffError);
      topStaff = [];
    }

    // Get popular products
    console.log('🛍️ Fetching popular products...');
    let popularProducts: any[] = [];
    try {
      popularProducts = await db('order_items')
        .join('orders', 'order_items.order_id', 'orders.id')
        .join('products', 'order_items.product_id', 'products.id')
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .whereBetween('orders.created_at', [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
        .select(
          'products.name',
          'categories.name as category',
          db.raw('SUM(order_items.quantity) as total_quantity'),
          db.raw('COALESCE(SUM(order_items.total_price), 0) as total_revenue')
        )
        .groupBy('products.id', 'products.name', 'categories.id', 'categories.name')
        .orderBy('total_quantity', 'desc')
        .limit(10);
      console.log('✅ Popular products result:', popularProducts);
    } catch (productsError) {
      console.error('❌ Popular products query failed:', productsError);
      popularProducts = [];
    }

    console.log('📤 Sending response...');
    
    // Transform data to match frontend expectations
    const transformedResponse = {
      period: { start: startDate, end: endDate },
      sales: { 
        monthly: parseFloat(salesOverview?.total_revenue) || 0 
      },
      orders: { 
        total: parseInt(salesOverview?.total_orders) || 0,
        completed: parseInt(salesOverview?.total_orders) || 0, // Assuming all fetched orders are completed
        averageValue: parseFloat(salesOverview?.average_order_value) || 0
      },
      inventory: {
        topSellingItems: popularProducts.map(item => ({
          name: item.name,
          quantity: item.total_quantity,
          revenue: parseFloat(item.total_revenue) || 0
        }))
      },
      staff: {
        topPerformers: topStaff.map(staff => ({
          name: staff.name,
          orders: staff.order_count,
          revenue: parseFloat(staff.total_sales) || 0
        }))
      }
    };
    
    console.log('✅ Transformed response:', JSON.stringify(transformedResponse, null, 2));
    
    res.json(transformedResponse);
  } catch (error) {
    const err = error as Error;
    console.error('❌ Overview report error:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Get sales report
export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const { start, end, groupBy = 'day' } = req.query;
    
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end || new Date().toISOString().split('T')[0];

    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = "to_char(created_at, 'YYYY-MM')";
        break;
      case 'week':
        dateFormat = "to_char(created_at, 'YYYY-WW')";
        break;
      case 'day':
      default:
        dateFormat = "DATE(created_at)";
        break;
    }

    const salesData = await db('orders')
      .whereBetween('created_at', [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
      .select(db.raw(`${dateFormat} as period`))
      .select(db.raw('COUNT(*) as order_count'))
      .select(db.raw('COALESCE(SUM(total_amount), 0) as total_sales'))
      .select(db.raw('COALESCE(AVG(total_amount), 0) as average_order_value'))
      .groupBy(db.raw(`${dateFormat}`))
      .orderBy('period', 'asc');

    // Transform data to match frontend expectations
    const transformedSalesData = {
      salesByDay: salesData.map((item: any) => ({
        date: item.period,
        total: parseFloat(item.total_sales) || 0
      }))
    };

    res.json(transformedSalesData);
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get inventory report
export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    // Get low stock items
    const lowStockItems = await db('inventory_items')
      .whereRaw('current_stock <= minimum_stock')
      .select('*')
      .orderBy('current_stock', 'asc');

    // Get inventory summary
    const inventorySummary = await db('inventory_items')
      .select(
        'inventory_type',
        db.raw('COUNT(*) as item_count'),
        db.raw('SUM(current_stock * cost_per_unit) as total_value')
      )
      .groupBy('inventory_type');

    // Get recent stock movements (if stock_movements table exists)
    let recentMovements: any[] = [];
    try {
      recentMovements = await db('stock_movements')
        .join('inventory_items', 'stock_movements.item_id', 'inventory_items.id')
        .select(
          'inventory_items.name',
          'stock_movements.*'
        )
        .orderBy('stock_movements.created_at', 'desc')
        .limit(20);
    } catch (e) {
      // Table might not exist yet
      console.warn('Stock movements table not found');
    }

    // Calculate total inventory value
    const totalValue = await db('inventory_items')
      .select(db.raw('SUM(current_stock * cost_per_unit) as total'))
      .first();

    // Transform data to match frontend expectations
    const transformedInventoryData = {
      lowStockItems: lowStockItems.map(item => ({
        id: item.id,
        name: item.name,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock
      })),
      totalValue: parseFloat(totalValue?.total) || 0
    };

    res.json(transformedInventoryData);
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get staff report (staff performance)
export const getStaffReport = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end || new Date().toISOString().split('T')[0];

    // Get staff performance
    const staffPerformance = await db('orders')
      .join('staff', 'orders.staff_id', 'staff.id')
      .whereBetween('orders.created_at', [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
      .select(
        'staff.name',
        'staff.role',
        db.raw('COUNT(orders.id) as orders'),
        db.raw('COALESCE(SUM(orders.total_amount), 0) as revenue'),
        db.raw('COALESCE(AVG(orders.total_amount), 0) as avgOrderValue')
      )
      .groupBy('staff.id', 'staff.name', 'staff.role')
      .orderBy('revenue', 'desc');

    // Transform data to match frontend expectations
    const transformedData = staffPerformance.map(staff => ({
      name: staff.name,
      role: staff.role,
      orders: staff.orders,
      revenue: parseFloat(staff.revenue) || 0,
      avgOrderValue: parseFloat(staff.avgOrderValue) || 0
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Staff report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get rooms report (room revenue)
export const getRoomsReport = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end || new Date().toISOString().split('T')[0];

    // Get room revenue (if room bookings exist)
    let roomRevenue = 0;
    try {
      const revenueData = await db('room_bookings')
        .whereBetween('check_in_date', [startDate, endDate])
        .select(db.raw('SUM(total_amount) as revenue'))
        .first();
      roomRevenue = parseFloat(revenueData?.revenue) || 0;
    } catch (e) {
      console.warn('Room bookings table not found, using default revenue');
    }

    // Get room status counts
    let roomStatusCounts: any[] = [];
    try {
      roomStatusCounts = await db('rooms')
        .select('status')
        .select(db.raw('COUNT(*) as count'))
        .groupBy('status')
        .orderBy('count', 'desc');
    } catch (e) {
      console.warn('Rooms table not found');
      roomStatusCounts = [];
    }

    // Transform data to match frontend expectations
    const transformedData = {
      roomRevenue,
      roomStatusCounts: roomStatusCounts.map(status => ({
        status: status.status,
        count: parseInt(status.count) || 0
      }))
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Rooms report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get performance report
export const getPerformanceReport = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end || new Date().toISOString().split('T')[0];

    // Staff performance
    const staffPerformance = await db('orders')
      .join('staff', 'orders.staff_id', 'staff.id')
      .whereBetween('orders.created_at', [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
      .select(
        'staff.name',
        'staff.role',
        db.raw('COUNT(orders.id) as total_orders'),
        db.raw('COALESCE(SUM(orders.total_amount), 0) as total_sales'),
        db.raw('COALESCE(AVG(orders.total_amount), 0) as average_order_value'),
        db.raw('COALESCE(SUM(orders.service_charge), 0) as total_service_charge')
      )
      .groupBy('staff.id', 'staff.name', 'staff.role')
      .orderBy('total_sales', 'desc');

    // Order status distribution
    const orderStatusDistribution = await db('orders')
      .whereBetween('created_at', [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
      .select(
        'status',
        db.raw('COUNT(*) as count')
      )
      .groupBy('status');

    // Average preparation time (if timestamps exist)
    let averagePreparationTime = null;
    try {
      const prepTimeData = await db('orders')
        .whereBetween('created_at', [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
        .whereNotNull('completed_at')
        .select(
          db.raw('AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_prep_minutes')
        )
        .first();
      
      averagePreparationTime = prepTimeData?.avg_prep_minutes || null;
    } catch (e) {
      console.warn('Could not calculate preparation time');
    }

    res.json({
      period: { start: startDate, end: endDate },
      staffPerformance,
      orderStatusDistribution,
      averagePreparationTime
    });
  } catch (error) {
    console.error('Performance report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- NEW FUNCTION ADDED BELOW ---

/**
 * @description Fetches completed orders with full details for admin receipt auditing.
 * @route GET /api/reports/receipts
 * @access Admin
 */
export const getReceiptsByDate = async (req: Request, res: Response) => {
  try {
    const { 
      start_date, 
      end_date,
      customer_name,
      order_type,
      limit = 100, 
      offset = 0 
    } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date and end_date are required' });
    }

    // 1. Get all completed orders in the date range with staff info
    let ordersQuery = db('orders')
      .join('staff', 'orders.staff_id', 'staff.id')
      .where('orders.status', 'completed') // Only completed receipts
      .whereBetween('orders.created_at', [start_date as string, end_date as string]);
    
    // Add customer name filter if provided
    if (customer_name) {
      ordersQuery = ordersQuery.where('orders.customer_name', 'ilike', `%${customer_name}%`);
    }

    // Add order type filter if provided
    if (order_type) {
      ordersQuery = ordersQuery.where('orders.order_type', order_type as string);
    }

    const orders = await ordersQuery
      .select(
        'orders.*',
        'staff.name as staff_name'
      )
      .orderBy('orders.created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // 2. Format data for each order to match ReceiptModal expectations
    const formattedOrders = [];
    
    for (const order of orders) {
      // Get order items
      const items = await db('order_items')
        .leftJoin('products', 'order_items.product_id', 'products.id')
        .where('order_id', order.id)
        .select(
          'order_items.quantity',
          'order_items.unit_price',
          'order_items.total_price',
          'products.name'
        );

      // Get payment method (take the first payment method)
      const payment = await db('payments')
        .where('order_id', order.id)
        .first();

      // Format according to ReceiptModal interface
      const formattedOrder = {
        // Original order data for table display
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at,
        total_amount: parseFloat(order.total_amount) || 0,
        customer_name: order.customer_name,
        staff_name: order.staff_name,
        order_type: order.order_type,
        
        // Formatted receipt data for ReceiptModal
        receiptData: {
          orderNumber: order.order_number,
          customerName: order.customer_name,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price) || 0,
            totalPrice: parseFloat(item.total_price) || 0
          })),
          subtotal: parseFloat(order.subtotal) || parseFloat(order.total_amount) || 0,
          total: parseFloat(order.total_amount) || 0,
          paymentMethod: payment?.payment_method || 'cash',
          staffName: order.staff_name,
          createdAt: order.created_at,
          orderType: order.order_type || 'general' // Add order type for dynamic receipt headers
        }
      };

      formattedOrders.push(formattedOrder);
    }

    // 3. Get total count for pagination
    let countQuery = db('orders')
      .where('status', 'completed')
      .whereBetween('created_at', [start_date as string, end_date as string]);
      
    if (customer_name) {
      countQuery = countQuery.where('customer_name', 'ilike', `%${customer_name}%`);
    }
    
    if (order_type) {
      countQuery = countQuery.where('order_type', order_type as string);
    }
      
    const totalResult = await countQuery.count('id as total');
    const total = (totalResult[0] as any).total;

    res.json({
      orders: formattedOrders,
      pagination: {
        total: total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (err) {
    console.error('Error fetching receipts:', err);
    res.status(500).json({ message: 'Error fetching receipts' });
  }
};
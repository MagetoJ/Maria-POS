const knex = require('knex');
require('dotenv').config();

const config = {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_mocha_dev',
    ssl: false
  }
};

async function testQueries() {
  const db = knex(config);
  
  try {
    console.log('=== Testing Dashboard Overview Stats Query ===');
    // Simulate the dashboard overview stats query
    const totalOrders = await db('orders').count('id as count');
    console.log('Total orders count:', totalOrders[0].count);
    
    const totalRevenue = await db('orders').sum('total_amount as total');
    console.log('Total revenue:', totalRevenue[0].total);
    
    console.log('\n=== Testing Reports Overview Query ===');
    // Simulate the reports overview query with date range
    const startDate = '2025-10-01';
    const endDate = '2025-10-11';
    
    const revenueInRange = await db('orders')
      .sum('total_amount as total')
      .where('created_at', '>=', startDate)
      .andWhere('created_at', '<=', endDate);
    console.log('Revenue in date range:', revenueInRange[0].total);
    
    console.log('\n=== Testing Sales Report Query ===');
    const salesReport = await db.raw(`
      SELECT DATE(created_at) as date, sum(total_amount) as total 
      FROM orders 
      WHERE created_at BETWEEN ? and ? 
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `, [startDate, endDate]);
    console.log('Sales report rows:', salesReport.rows.length);
    
    console.log('\n=== Testing Inventory Report Query ===');
    const inventoryReport = await db('inventory_items')
      .select('id', 'name', 'current_stock', 'minimum_stock')
      .whereRaw('current_stock <= minimum_stock')
      .andWhere('is_active', true)
      .orderBy('current_stock', 'asc');
    console.log('Low stock items:', inventoryReport.length);
    
    console.log('\n=== Testing Staff Report Query ===');
    const staffReport = await db('orders')
      .join('staff', 'orders.staff_id', 'staff.id')
      .select('staff.name', 'staff.role')
      .count('orders.id as orders')
      .sum('orders.total_amount as revenue')
      .avg('orders.total_amount as avgOrderValue')
      .where('orders.created_at', '>=', startDate)
      .andWhere('orders.created_at', '<=', endDate)
      .groupBy('staff.name', 'staff.role', 'staff.id')
      .orderBy('revenue', 'desc');
    console.log('Staff report rows:', staffReport.length);
    
    console.log('\n=== Testing Room Report Query ===');
    const roomRevenue = await db('orders')
      .sum('total_amount as total')
      .where('order_type', 'room')
      .andWhere('created_at', '>=', startDate)
      .andWhere('created_at', '<=', endDate);
    console.log('Room revenue:', roomRevenue[0].total);
    
    console.log('\n✅ All queries executed successfully! Database schema is working correctly.');
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  } finally {
    await db.destroy();
  }
}

testQueries();
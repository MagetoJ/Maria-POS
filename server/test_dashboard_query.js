const knex = require('knex');
require('dotenv').config();

const config = {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_mocha_dev',
    ssl: false
  }
};

async function testDashboardQuery() {
  const db = knex(config);
  
  try {
    console.log('=== Testing Dashboard Overview Query Components ===');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Today date:', today);
    
    console.log('\n1. Testing todays orders query...');
    const todaysOrders = await db('orders')
        .where('created_at', '>=', today)
        .select('*');
    console.log('Todays orders count:', todaysOrders.length);
    
    console.log('\n2. Testing active staff count...');
    const activeStaff = await db('staff').where({ is_active: true }).count('* as count').first();
    console.log('Active staff count:', activeStaff?.count);
    
    console.log('\n3. Testing low stock items...');
    const lowStock = await db('inventory_items').whereRaw('current_stock <= minimum_stock').count('* as count').first();
    console.log('Low stock items count:', lowStock?.count);
    
    console.log('\n4. Testing recent orders query (problematic)...');
    // First, let's see what columns are actually in the orders table
    const ordersColumns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position;
    `);
    console.log('Available columns in orders table:', ordersColumns.rows.map(r => r.column_name));
    
    // Try the original query that's failing
    console.log('\n5. Testing original query with location column...');
    try {
      const recentOrders = await db('orders')
          .orderBy('created_at', 'desc')
          .limit(5)
          .select('id', 'order_number', 'location', 'total_amount', 'created_at');
      console.log('Original query works');
    } catch (error) {
      console.log('❌ Original query failed:', error.message);
      
      // Try without the location column
      console.log('\n6. Testing corrected query without location...');
      const recentOrders = await db('orders')
          .orderBy('created_at', 'desc')
          .limit(5)
          .select('id', 'order_number', 'total_amount', 'created_at');
      console.log('✅ Corrected query works, returned', recentOrders.length, 'orders');
    }
    
    console.log('\n✅ Dashboard query testing completed');
    
  } catch (error) {
    console.error('❌ Error testing dashboard query:', error.message);
  } finally {
    await db.destroy();
  }
}

testDashboardQuery();
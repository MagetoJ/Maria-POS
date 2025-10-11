const knex = require('knex');
require('dotenv').config();

const config = {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_mocha_dev',
    ssl: false
  }
};

async function checkSchema() {
  const db = knex(config);
  
  try {
    console.log('=== ORDERS TABLE SCHEMA ===');
    const ordersSchema = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position;
    `);
    console.log(ordersSchema.rows);
    
    console.log('\n=== INVENTORY_ITEMS TABLE SCHEMA ===');
    const inventorySchema = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' 
      ORDER BY ordinal_position;
    `);
    console.log(inventorySchema.rows);
    
    console.log('\n=== COLUMN EXISTENCE CHECK ===');
    const createdAtExists = await db.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'created_at';
    `);
    console.log('created_at column exists:', createdAtExists.rows.length > 0);
    
    const minimumStockExists = await db.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'minimum_stock';
    `);
    console.log('minimum_stock column exists:', minimumStockExists.rows.length > 0);

    // Test actual query that's failing
    console.log('\n=== TESTING ACTUAL QUERIES ===');
    try {
      const orderTest = await db.raw('SELECT created_at FROM orders LIMIT 1');
      console.log('Orders created_at query works:', orderTest.rows.length >= 0);
    } catch (err) {
      console.log('Orders created_at query failed:', err.message);
    }

    try {
      const inventoryTest = await db.raw('SELECT minimum_stock FROM inventory_items LIMIT 1');
      console.log('Inventory minimum_stock query works:', inventoryTest.rows.length >= 0);
    } catch (err) {
      console.log('Inventory minimum_stock query failed:', err.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

checkSchema();
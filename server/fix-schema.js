const knex = require('knex');
const config = require('./knexfile');

const db = knex(config.development);

async function fixSchema() {
  try {
    console.log('🔧 Fixing database schema...');

    // Fix products table - add missing columns
    console.log('Adding missing columns to products table...');
    try {
      await db.schema.table('products', function(table) {
        table.text('image_url').nullable();
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Products table updated');
    } catch (err) {
      console.log('⚠️ Products table columns may already exist:', err.message);
    }

    // Fix rooms table - add missing columns 
    console.log('Adding missing columns to rooms table...');
    try {
      await db.schema.table('rooms', function(table) {
        table.text('guest_name').nullable();
        table.date('check_in_date').nullable(); 
        table.date('check_out_date').nullable();
        table.real('rate').nullable();
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Rooms table updated');
    } catch (err) {
      console.log('⚠️ Rooms table columns may already exist:', err.message);
    }

    // Test the API endpoints that were failing
    console.log('\n🧪 Testing database operations...');
    
    // Test products
    try {
      const products = await db('products')
        .join('categories', 'products.category_id', 'categories.id')
        .select('products.*', 'categories.name as category_name')
        .limit(1);
      console.log('✅ Products JOIN query works');
    } catch (err) {
      console.log('❌ Products JOIN query failed:', err.message);
    }

    // Test inventory
    try {
      const inventory = await db('inventory_items').select('*').limit(1);
      console.log('✅ Inventory query works');
    } catch (err) {
      console.log('❌ Inventory query failed:', err.message);
    }

    // Test rooms
    try {
      const rooms = await db('rooms').select('*').limit(1);
      console.log('✅ Rooms query works');
    } catch (err) {
      console.log('❌ Rooms query failed:', err.message);
    }

    console.log('\n✅ Schema fix complete!');

  } catch (error) {
    console.error('❌ Schema fix failed:', error);
  } finally {
    await db.destroy();
  }
}

fixSchema();
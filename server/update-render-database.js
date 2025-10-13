const knex = require('knex');
require('dotenv').config();

// This script connects directly to your Render database
// Set this to your actual Render database connection string
const RENDER_DATABASE_URL = process.env.RENDER_DATABASE_URL || 'YOUR_RENDER_DATABASE_CONNECTION_STRING_HERE';

if (!RENDER_DATABASE_URL || RENDER_DATABASE_URL === 'YOUR_RENDER_DATABASE_CONNECTION_STRING_HERE') {
  console.error('❌ Please set your RENDER_DATABASE_URL in .env file or as environment variable');
  console.log('📌 You can find this in your Render dashboard under your database settings');
  process.exit(1);
}

const db = knex({
  client: 'pg',
  connection: {
    connectionString: RENDER_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
});

async function updateRenderDatabase() {
  try {
    console.log('🚀 Connecting to Render PostgreSQL database...');
    
    // Test connection
    await db.raw('SELECT 1');
    console.log('✅ Connected to Render database successfully');
    
    // Get database info
    const dbInfo = await db.raw('SELECT version() as version, current_database() as database, current_user as user');
    console.log('📊 Database:', dbInfo.rows[0].database);
    console.log('📊 User:', dbInfo.rows[0].user);
    console.log('📊 Version:', dbInfo.rows[0].version.split(' ').slice(0, 2).join(' '));

    // Create missing tables
    await createMissingTables();
    
    // Verify all tables exist
    await verifyTables();
    
    // Insert/update sample data
    await updateSampleData();
    
    console.log('\n🎉 RENDER DATABASE UPDATE COMPLETE!');
    console.log('\n📋 Your app should now work properly with all tables and data!');
    
    await db.destroy();
  } catch (error) {
    console.error('❌ Database update failed:', error.message);
    console.error('Full error:', error);
    await db.destroy();
    process.exit(1);
  }
}

async function createMissingTables() {
  console.log('\n📝 Creating missing tables...');

  // Check for order_items table
  const hasOrderItems = await db.schema.hasTable('order_items');
  if (!hasOrderItems) {
    await db.schema.createTable('order_items', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('orders.id').onDelete('CASCADE');
      table.integer('product_id').unsigned().references('products.id');
      table.integer('quantity').notNullable();
      table.decimal('unit_price', 10, 2).notNullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.text('special_instructions').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ order_items table created');
  } else {
    console.log('📋 order_items table already exists');
  }

  // Check for inventory table
  const hasInventory = await db.schema.hasTable('inventory');
  if (!hasInventory) {
    await db.schema.createTable('inventory', (table) => {
      table.increments('id').primary();
      table.string('item_name').notNullable();
      table.string('sku').unique();
      table.integer('current_stock').defaultTo(0);
      table.integer('min_stock_level').defaultTo(10);
      table.integer('max_stock_level').defaultTo(100);
      table.decimal('cost_price', 10, 2).nullable();
      table.string('supplier').nullable();
      table.date('last_restocked').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ inventory table created');
  } else {
    console.log('📋 inventory table already exists');
  }

  // Check for shifts table
  const hasShifts = await db.schema.hasTable('shifts');
  if (!hasShifts) {
    await db.schema.createTable('shifts', (table) => {
      table.increments('id').primary();
      table.integer('staff_id').unsigned().references('staff.id');
      table.datetime('start_time').notNullable();
      table.datetime('end_time').nullable();
      table.decimal('hours_worked', 5, 2).nullable();
      table.decimal('hourly_rate', 10, 2).nullable();
      table.decimal('total_pay', 10, 2).nullable();
      table.string('status').defaultTo('active'); // active, completed, cancelled
      table.text('notes').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ shifts table created');
  } else {
    console.log('📋 shifts table already exists');
  }

  // Check for attendance table
  const hasAttendance = await db.schema.hasTable('attendance');
  if (!hasAttendance) {
    await db.schema.createTable('attendance', (table) => {
      table.increments('id').primary();
      table.integer('staff_id').unsigned().references('staff.id');
      table.date('date').notNullable();
      table.time('clock_in').nullable();
      table.time('clock_out').nullable();
      table.decimal('total_hours', 5, 2).nullable();
      table.string('status').defaultTo('present'); // present, absent, late, early_leave
      table.text('notes').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ attendance table created');
  } else {
    console.log('📋 attendance table already exists');
  }

  // Check for room_transactions table
  const hasRoomTransactions = await db.schema.hasTable('room_transactions');
  if (!hasRoomTransactions) {
    await db.schema.createTable('room_transactions', (table) => {
      table.increments('id').primary();
      table.string('transaction_id').unique().notNullable();
      table.integer('room_id').unsigned().references('rooms.id');
      table.integer('staff_id').unsigned().references('staff.id');
      table.string('guest_name').notNullable();
      table.string('guest_phone').nullable();
      table.string('guest_email').nullable();
      table.date('check_in_date').notNullable();
      table.date('check_out_date').notNullable();
      table.integer('nights').notNullable();
      table.decimal('room_rate', 10, 2).notNullable();
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('payment_method').nullable();
      table.string('status').defaultTo('confirmed'); // confirmed, checked_in, checked_out, cancelled
      table.text('notes').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ room_transactions table created');
  } else {
    console.log('📋 room_transactions table already exists');
  }

  // Check for settings table (if not already exists)
  const hasSettings = await db.schema.hasTable('settings');
  if (!hasSettings) {
    await db.schema.createTable('settings', (table) => {
      table.increments('id').primary();
      table.string('key').unique().notNullable();
      table.text('value').nullable();
      table.string('description').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ settings table created');
  } else {
    console.log('📋 settings table already exists');
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying all tables...');

  const expectedTables = [
    'staff', 'categories', 'products', 'orders', 'order_items',
    'tables', 'rooms', 'inventory', 'shifts', 'attendance', 
    'room_transactions', 'settings'
  ];

  const existingTables = [];
  const missingTables = [];

  for (const tableName of expectedTables) {
    const exists = await db.schema.hasTable(tableName);
    if (exists) {
      existingTables.push(tableName);
    } else {
      missingTables.push(tableName);
    }
  }

  console.log(`✅ Found ${existingTables.length} tables:`, existingTables.join(', '));
  
  if (missingTables.length > 0) {
    console.log(`❌ Missing ${missingTables.length} tables:`, missingTables.join(', '));
  } else {
    console.log('🎉 All expected tables are present!');
  }
}

async function updateSampleData() {
  console.log('\n📊 Updating sample data...');

  // Ensure staff data exists
  const staffCount = await db('staff').count('id as count').first();
  if (staffCount.count == 0) {
    await db('staff').insert([
      {
        employee_id: 'EMP001',
        username: 'admin',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        pin: '1234',
        is_active: true
      },
      {
        employee_id: 'EMP002',
        username: 'john.manager',
        password: 'manager123',
        name: 'John Manager',
        role: 'manager',
        pin: '5678',
        is_active: true
      },
      {
        employee_id: 'EMP003',
        username: 'mary.waiter',
        password: 'waiter123',
        name: 'Mary Waiter',
        role: 'waiter',
        pin: '9012',
        is_active: true
      },
      {
        employee_id: 'EMP004',
        username: 'sarah.receptionist',
        password: 'reception123',
        name: 'Sarah Receptionist',
        role: 'receptionist',
        pin: '3456',
        is_active: true
      }
    ]);
    console.log('👥 Staff data added');
  } else {
    console.log(`👥 Staff data exists (${staffCount.count} users)`);
  }

  // Ensure basic settings exist
  const hasSettings = await db.schema.hasTable('settings');
  if (hasSettings) {
    const settingsCount = await db('settings').count('id as count').first();
    if (settingsCount.count == 0) {
      await db('settings').insert([
        { key: 'business_name', value: 'Maria Havens POS', description: 'Business name displayed on receipts' },
        { key: 'tax_rate', value: '0.08', description: 'Default tax rate (8%)' },
        { key: 'currency', value: 'USD', description: 'Default currency' },
        { key: 'receipt_footer', value: 'Thank you for your business!', description: 'Footer text on receipts' }
      ]);
      console.log('⚙️ Settings data added');
    } else {
      console.log(`⚙️ Settings data exists (${settingsCount.count} settings)`);
    }
  }

  // Check current data counts
  const counts = {};
  const tables = ['staff', 'categories', 'products', 'tables', 'rooms'];
  
  for (const table of tables) {
    const hasTable = await db.schema.hasTable(table);
    if (hasTable) {
      const result = await db(table).count('id as count').first();
      counts[table] = result.count;
    } else {
      counts[table] = 'N/A';
    }
  }

  console.log('\n📈 Current data counts:');
  Object.entries(counts).forEach(([table, count]) => {
    console.log(`   ${table}: ${count}`);
  });
}

// Instructions for user
console.log('🚨 IMPORTANT: Before running this script, you need to:');
console.log('1. Get your Render database connection string from your Render dashboard');
console.log('2. Set it as RENDER_DATABASE_URL environment variable or in .env file');
console.log('3. Run: RENDER_DATABASE_URL="your_connection_string" node update-render-database.js');
console.log('\n👉 Starting in 5 seconds...\n');

setTimeout(() => {
  updateRenderDatabase();
}, 5000);
const knex = require('knex');
require('dotenv').config();

// PostgreSQL configuration for production
let connectionConfig;

if (process.env.DATABASE_URL) {
  // Production environment (Render)
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else if (process.env.NODE_ENV === 'production') {
  // Production with separate env vars
  connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  };
} else {
  // Local development
  connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'pos_mocha_dev',
    ssl: false
  };
}

const db = knex({
  client: 'pg',
  connection: connectionConfig
});

async function setupProductionDatabase() {
  try {
    console.log('🚀 Setting up PRODUCTION PostgreSQL database...');
    
    // Test connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Get database info
    const dbInfo = await db.raw('SELECT version() as version');
    console.log('📊 Database version:', dbInfo.rows[0].version.split(' ')[0], dbInfo.rows[0].version.split(' ')[1]);

    // Create all tables
    await createStaffTable();
    await createCategoriesTable();
    await createProductsTable();
    await createTablesTable();
    await createRoomsTable();
    await createOrdersTable();
    await createOrderItemsTable();
    await createInventoryTable();
    await createShiftsTable();
    await createAttendanceTable();
    await createRoomTransactionsTable();
    await createSettingsTable();

    // Insert sample data
    await insertSampleData();

    console.log('\n🎉 PRODUCTION DATABASE SETUP COMPLETE!');
    console.log('\n📋 Login Credentials:');
    console.log('   👤 Admin: admin / admin123 (PIN: 1234)');
    console.log('   👤 Manager: john.manager / manager123 (PIN: 5678)');
    console.log('   👤 Waiter: mary.waiter / waiter123 (PIN: 9012)');
    console.log('   👤 Receptionist: sarah.receptionist / reception123 (PIN: 3456)');
    
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    await db.destroy();
    process.exit(1);
  }
}

async function createStaffTable() {
  const hasTable = await db.schema.hasTable('staff');
  if (!hasTable) {
    console.log('📝 Creating staff table...');
    await db.schema.createTable('staff', (table) => {
      table.increments('id').primary();
      table.string('employee_id').notNullable().unique();
      table.string('username').notNullable().unique();
      table.string('password').notNullable();
      table.string('name').notNullable();
      table.string('role').notNullable();
      table.string('pin').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
    console.log('✅ Staff table created');
  } else {
    console.log('📋 Staff table exists');
  }
}

async function createCategoriesTable() {
  const hasTable = await db.schema.hasTable('categories');
  if (!hasTable) {
    console.log('📝 Creating categories table...');
    await db.schema.createTable('categories', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('description');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
    console.log('✅ Categories table created');
  } else {
    console.log('📋 Categories table exists');
  }
}

async function createProductsTable() {
  const hasTable = await db.schema.hasTable('products');
  if (!hasTable) {
    console.log('📝 Creating products table...');
    await db.schema.createTable('products', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.integer('category_id').unsigned().references('categories.id');
      table.integer('preparation_time').defaultTo(15); // minutes
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
    console.log('✅ Products table created');
  } else {
    console.log('📋 Products table exists');
  }
}

async function createOrdersTable() {
  const hasTable = await db.schema.hasTable('orders');
  if (!hasTable) {
    console.log('📝 Creating orders table...');
    await db.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.string('order_number').unique().notNullable();
      table.integer('staff_id').unsigned().references('staff.id');
      table.integer('table_id').unsigned().nullable().references('tables.id');
      table.integer('room_id').unsigned().nullable().references('rooms.id');
      table.decimal('subtotal', 10, 2).defaultTo(0);
      table.decimal('tax_amount', 10, 2).defaultTo(0);
      table.decimal('tip_amount', 10, 2).defaultTo(0);
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('status').defaultTo('pending'); // pending, preparing, ready, served, paid
      table.string('payment_method').nullable();
      table.text('notes').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ Orders table created');
  } else {
    console.log('📋 Orders table exists');
  }
}

async function createOrderItemsTable() {
  const hasTable = await db.schema.hasTable('order_items');
  if (!hasTable) {
    console.log('📝 Creating order_items table...');
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
    console.log('✅ Order items table created');
  } else {
    console.log('📋 Order items table exists');
  }
}

async function createTablesTable() {
  const hasTable = await db.schema.hasTable('tables');
  if (!hasTable) {
    console.log('📝 Creating tables table...');
    await db.schema.createTable('tables', (table) => {
      table.increments('id').primary();
      table.string('table_number').unique().notNullable();
      table.integer('capacity').notNullable();
      table.string('status').defaultTo('available'); // available, occupied, reserved, out_of_service
      table.string('location').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ Tables table created');
  } else {
    console.log('📋 Tables table exists');
  }
}

async function createRoomsTable() {
  const hasTable = await db.schema.hasTable('rooms');
  if (!hasTable) {
    console.log('📝 Creating rooms table...');
    await db.schema.createTable('rooms', (table) => {
      table.increments('id').primary();
      table.string('room_number').unique().notNullable();
      table.string('room_type').notNullable();
      table.decimal('rate_per_night', 10, 2).notNullable();
      table.string('status').defaultTo('available'); // available, occupied, reserved, maintenance
      table.text('description').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ Rooms table created');
  } else {
    console.log('📋 Rooms table exists');
  }
}

async function createInventoryTable() {
  const hasTable = await db.schema.hasTable('inventory');
  if (!hasTable) {
    console.log('📝 Creating inventory table...');
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
    console.log('✅ Inventory table created');
  } else {
    console.log('📋 Inventory table exists');
  }
}

async function createShiftsTable() {
  const hasTable = await db.schema.hasTable('shifts');
  if (!hasTable) {
    console.log('📝 Creating shifts table...');
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
    console.log('✅ Shifts table created');
  } else {
    console.log('📋 Shifts table exists');
  }
}

async function createAttendanceTable() {
  const hasTable = await db.schema.hasTable('attendance');
  if (!hasTable) {
    console.log('📝 Creating attendance table...');
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
    console.log('✅ Attendance table created');
  } else {
    console.log('📋 Attendance table exists');
  }
}

async function createRoomTransactionsTable() {
  const hasTable = await db.schema.hasTable('room_transactions');
  if (!hasTable) {
    console.log('📝 Creating room_transactions table...');
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
    console.log('✅ Room transactions table created');
  } else {
    console.log('📋 Room transactions table exists');
  }
}

async function createSettingsTable() {
  const hasTable = await db.schema.hasTable('settings');
  if (!hasTable) {
    console.log('📝 Creating settings table...');
    await db.schema.createTable('settings', (table) => {
      table.increments('id').primary();
      table.string('key').unique().notNullable();
      table.text('value').nullable();
      table.string('description').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ Settings table created');
  } else {
    console.log('📋 Settings table exists');
  }
}

async function insertSampleData() {
  console.log('📊 Inserting sample data...');

  // Insert staff if none exist
  const existingStaff = await db('staff').count('id as count').first();
  if (existingStaff.count == 0) {
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
    console.log('👥 Staff data inserted');
  }

  // Insert categories if none exist
  const existingCategories = await db('categories').count('id as count').first();
  if (existingCategories.count == 0) {
    await db('categories').insert([
      { name: 'Beverages', description: 'Hot and cold drinks', is_active: true },
      { name: 'Main Courses', description: 'Main dishes and entrees', is_active: true },
      { name: 'Appetizers', description: 'Starters and small plates', is_active: true },
      { name: 'Desserts', description: 'Sweet treats and desserts', is_active: true },
      { name: 'Salads', description: 'Fresh salads and healthy options', is_active: true },
      { name: 'Sandwiches', description: 'Sandwiches and wraps', is_active: true },
      { name: 'Seafood', description: 'Fresh seafood dishes', is_active: true },
      { name: 'Vegetarian', description: 'Vegetarian and vegan options', is_active: true }
    ]);
    console.log('🍽️ Categories data inserted');
  }

  // Insert products if none exist
  const existingProducts = await db('products').count('id as count').first();
  if (existingProducts.count == 0) {
    await db('products').insert([
      // Beverages
      { name: 'Espresso', description: 'Rich Italian espresso', price: 3.50, category_id: 1, preparation_time: 5, is_active: true },
      { name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 4.50, category_id: 1, preparation_time: 7, is_active: true },
      { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 4.00, category_id: 1, preparation_time: 3, is_active: true },
      { name: 'Green Tea', description: 'Premium green tea', price: 3.00, category_id: 1, preparation_time: 5, is_active: true },
      
      // Main Courses
      { name: 'Grilled Salmon', description: 'Atlantic salmon with herbs', price: 24.99, category_id: 2, preparation_time: 25, is_active: true },
      { name: 'Beef Tenderloin', description: 'Prime beef tenderloin steak', price: 32.99, category_id: 2, preparation_time: 30, is_active: true },
      { name: 'Chicken Parmesan', description: 'Breaded chicken with marinara', price: 19.99, category_id: 2, preparation_time: 20, is_active: true },
      { name: 'Lamb Chops', description: 'Herb-crusted lamb chops', price: 28.99, category_id: 2, preparation_time: 25, is_active: true },
      
      // Appetizers
      { name: 'Calamari Rings', description: 'Crispy fried calamari', price: 12.99, category_id: 3, preparation_time: 12, is_active: true },
      { name: 'Bruschetta', description: 'Toasted bread with tomatoes', price: 9.99, category_id: 3, preparation_time: 8, is_active: true },
      { name: 'Shrimp Cocktail', description: 'Chilled shrimp with cocktail sauce', price: 14.99, category_id: 3, preparation_time: 5, is_active: true },
      
      // Desserts
      { name: 'Tiramisu', description: 'Classic Italian tiramisu', price: 8.99, category_id: 4, preparation_time: 5, is_active: true },
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 9.99, category_id: 4, preparation_time: 15, is_active: true },
      { name: 'Cheesecake', description: 'New York style cheesecake', price: 7.99, category_id: 4, preparation_time: 3, is_active: true },
      
      // Salads
      { name: 'Caesar Salad', description: 'Romaine lettuce with Caesar dressing', price: 11.99, category_id: 5, preparation_time: 10, is_active: true },
      { name: 'Greek Salad', description: 'Mixed greens with feta and olives', price: 13.99, category_id: 5, preparation_time: 8, is_active: true }
    ]);
    console.log('🍴 Products data inserted');
  }

  // Insert tables if none exist
  const existingTables = await db('tables').count('id as count').first();
  if (existingTables.count == 0) {
    await db('tables').insert([
      { table_number: 'T01', capacity: 2, status: 'available', location: 'Main Floor' },
      { table_number: 'T02', capacity: 4, status: 'available', location: 'Main Floor' },
      { table_number: 'T03', capacity: 6, status: 'available', location: 'Main Floor' },
      { table_number: 'T04', capacity: 2, status: 'available', location: 'Patio' },
      { table_number: 'T05', capacity: 4, status: 'available', location: 'Patio' },
      { table_number: 'T06', capacity: 8, status: 'available', location: 'Private Room' },
      { table_number: 'T07', capacity: 10, status: 'available', location: 'Main Floor' },
      { table_number: 'T08', capacity: 4, status: 'available', location: 'Window Side' }
    ]);
    console.log('🪑 Tables data inserted');
  }

  // Insert rooms if none exist
  const existingRooms = await db('rooms').count('id as count').first();
  if (existingRooms.count == 0) {
    await db('rooms').insert([
      { room_number: '101', room_type: 'Standard', rate_per_night: 99.99, status: 'available', description: 'Standard room with queen bed' },
      { room_number: '102', room_type: 'Standard', rate_per_night: 99.99, status: 'available', description: 'Standard room with twin beds' },
      { room_number: '103', room_type: 'Standard', rate_per_night: 99.99, status: 'available', description: 'Standard room with garden view' },
      { room_number: '201', room_type: 'Deluxe', rate_per_night: 149.99, status: 'available', description: 'Deluxe room with king bed and balcony' },
      { room_number: '202', room_type: 'Deluxe', rate_per_night: 149.99, status: 'available', description: 'Deluxe room with ocean view' },
      { room_number: '203', room_type: 'Deluxe', rate_per_night: 149.99, status: 'available', description: 'Deluxe room with jacuzzi' },
      { room_number: '301', room_type: 'Suite', rate_per_night: 249.99, status: 'available', description: 'Luxury suite with separate living area' },
      { room_number: '302', room_type: 'Suite', rate_per_night: 249.99, status: 'available', description: 'Executive suite with work area' },
      { room_number: '401', room_type: 'Penthouse', rate_per_night: 399.99, status: 'available', description: 'Penthouse suite with panoramic views' },
      { room_number: '402', room_type: 'Penthouse', rate_per_night: 399.99, status: 'available', description: 'Presidential suite with private terrace' }
    ]);
    console.log('🏨 Rooms data inserted');
  }

  // Insert settings if none exist
  const existingSettings = await db('settings').count('id as count').first();
  if (existingSettings.count == 0) {
    await db('settings').insert([
      { key: 'business_name', value: 'Maria Havens POS', description: 'Business name displayed on receipts' },
      { key: 'tax_rate', value: '0.08', description: 'Default tax rate (8%)' },
      { key: 'currency', value: 'USD', description: 'Default currency' },
      { key: 'receipt_footer', value: 'Thank you for your business!', description: 'Footer text on receipts' },
      { key: 'max_table_capacity', value: '12', description: 'Maximum capacity per table' }
    ]);
    console.log('⚙️ Settings data inserted');
  }

  console.log('✅ Sample data insertion complete!');
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupProductionDatabase();
}

module.exports = { setupProductionDatabase };
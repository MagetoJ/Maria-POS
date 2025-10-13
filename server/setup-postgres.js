const knex = require('knex');
require('dotenv').config();

// PostgreSQL configuration
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔧 Setting up PostgreSQL database...');
    
    // Test connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Create staff table
    const hasStaffTable = await db.schema.hasTable('staff');
    if (!hasStaffTable) {
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
      console.log('✅ Staff table created successfully!');
    } else {
      console.log('📋 Staff table already exists');
    }

    // Check if users already exist
    const existingUsers = await db('staff').select('*');
    if (existingUsers.length === 0) {
      console.log('👥 Adding demo users...');
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
      console.log('✅ Demo users created successfully!');
    } else {
      console.log('👥 Users already exist, skipping user creation');
      console.log(`   Found ${existingUsers.length} existing users`);
    }

    // Create categories table
    const hasCategoriesTable = await db.schema.hasTable('categories');
    if (!hasCategoriesTable) {
      console.log('📝 Creating categories table...');
      await db.schema.createTable('categories', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.string('description');
        table.timestamps(true, true);
      });

      // Insert sample categories
      await db('categories').insert([
        { name: 'Beverages', description: 'Hot and cold drinks' },
        { name: 'Main Courses', description: 'Main dishes and entrees' },
        { name: 'Appetizers', description: 'Starters and small plates' },
        { name: 'Desserts', description: 'Sweet treats and desserts' }
      ]);
      console.log('✅ Categories table created with sample data');
    }

    // Create products table
    const hasProductsTable = await db.schema.hasTable('products');
    if (!hasProductsTable) {
      console.log('📝 Creating products table...');
      await db.schema.createTable('products', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description');
        table.decimal('price', 10, 2).notNullable();
        table.integer('category_id').unsigned().references('categories.id');
        table.integer('stock_quantity').defaultTo(0);
        table.boolean('is_available').defaultTo(true);
        table.timestamps(true, true);
      });

      // Insert sample products
      await db('products').insert([
        { name: 'Coffee', description: 'Freshly brewed coffee', price: 3.50, category_id: 1, stock_quantity: 100, is_available: true },
        { name: 'Tea', description: 'Premium tea selection', price: 2.50, category_id: 1, stock_quantity: 50, is_available: true },
        { name: 'Burger', description: 'Classic beef burger', price: 12.99, category_id: 2, stock_quantity: 25, is_available: true },
        { name: 'Pizza', description: 'Margherita pizza', price: 15.99, category_id: 2, stock_quantity: 15, is_available: true }
      ]);
      console.log('✅ Products table created with sample data');
    }

    // Create other essential tables
    await createOrdersTable();
    await createTablesTable();
    await createRoomsTable();

    console.log('\n📋 Login Credentials:');
    console.log('   👤 Admin: admin / admin123 (PIN: 1234)');
    console.log('   👤 Manager: john.manager / manager123 (PIN: 5678)');
    console.log('   👤 Waiter: mary.waiter / waiter123 (PIN: 9012)');
    console.log('   👤 Receptionist: sarah.receptionist / reception123 (PIN: 3456)');
    console.log('\n🎉 Database setup complete!');
    
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\nFull error:', error);
    await db.destroy();
    process.exit(1);
  }
}

async function createOrdersTable() {
  const hasTable = await db.schema.hasTable('orders');
  if (!hasTable) {
    await db.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.string('order_number').unique().notNullable();
      table.integer('staff_id').unsigned().references('staff.id');
      table.integer('table_id').unsigned().nullable();
      table.integer('room_id').unsigned().nullable();
      table.decimal('subtotal', 10, 2).defaultTo(0);
      table.decimal('tax_amount', 10, 2).defaultTo(0);
      table.decimal('tip_amount', 10, 2).defaultTo(0);
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('status').defaultTo('pending');
      table.string('payment_method').nullable();
      table.timestamps(true, true);
    });
    console.log('✅ Orders table created');
  }
}

async function createTablesTable() {
  const hasTable = await db.schema.hasTable('tables');
  if (!hasTable) {
    await db.schema.createTable('tables', (table) => {
      table.increments('id').primary();
      table.string('table_number').unique().notNullable();
      table.integer('capacity').notNullable();
      table.string('status').defaultTo('available');
      table.string('location').nullable();
      table.timestamps(true, true);
    });

    // Insert sample tables
    await db('tables').insert([
      { table_number: 'T01', capacity: 2, status: 'available', location: 'Main Floor' },
      { table_number: 'T02', capacity: 4, status: 'available', location: 'Main Floor' },
      { table_number: 'T03', capacity: 6, status: 'available', location: 'Main Floor' },
      { table_number: 'T04', capacity: 2, status: 'available', location: 'Patio' }
    ]);
    console.log('✅ Tables created with sample data');
  }
}

async function createRoomsTable() {
  const hasTable = await db.schema.hasTable('rooms');
  if (!hasTable) {
    await db.schema.createTable('rooms', (table) => {
      table.increments('id').primary();
      table.string('room_number').unique().notNullable();
      table.string('room_type').notNullable();
      table.decimal('rate_per_night', 10, 2).notNullable();
      table.string('status').defaultTo('available');
      table.text('description').nullable();
      table.timestamps(true, true);
    });

    // Insert sample rooms
    await db('rooms').insert([
      { room_number: '101', room_type: 'Standard', rate_per_night: 99.99, status: 'available', description: 'Standard room with queen bed' },
      { room_number: '102', room_type: 'Standard', rate_per_night: 99.99, status: 'available', description: 'Standard room with twin beds' },
      { room_number: '201', room_type: 'Deluxe', rate_per_night: 149.99, status: 'available', description: 'Deluxe room with king bed and balcony' },
      { room_number: '301', room_type: 'Suite', rate_per_night: 249.99, status: 'available', description: 'Luxury suite with separate living area' }
    ]);
    console.log('✅ Rooms created with sample data');
  }
}

setupDatabase();
const knex = require('knex');
const path = require('path');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'database', 'pos.sqlite3')
  },
  useNullAsDefault: true
});

async function createAllTables() {
  try {
    console.log('Creating all tables...');

    // Categories
    await db.schema.dropTableIfExists('categories');
    await db.schema.createTable('categories', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('description');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ Categories table created');

    // Products
    await db.schema.dropTableIfExists('products');
    await db.schema.createTable('products', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.integer('category_id').references('id').inTable('categories');
      table.decimal('price', 10, 2).notNullable();
      table.text('description');
      table.boolean('is_available').defaultTo(true);
      table.integer('preparation_time').defaultTo(10);
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ Products table created');

    // Orders
    await db.schema.dropTableIfExists('orders');
    await db.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.string('order_number').notNullable().unique();
      table.string('order_type').notNullable(); // dine-in, takeout, delivery, room_service
      table.integer('staff_id').references('id').inTable('staff');
      table.string('location'); // table number or room number
      table.string('customer_name');
      table.string('customer_phone');
      table.string('delivery_address');
      table.string('status').defaultTo('pending'); // pending, preparing, completed, cancelled
      table.string('delivery_status'); // unassigned, assigned, out_for_delivery, delivered
      table.decimal('subtotal', 10, 2);
      table.decimal('tax', 10, 2);
      table.decimal('total_amount', 10, 2);
      table.text('notes');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('completed_at');
    });
    console.log('✅ Orders table created');

    // Order Items
    await db.schema.dropTableIfExists('order_items');
    await db.schema.createTable('order_items', (table) => {
      table.increments('id').primary();
      table.integer('order_id').references('id').inTable('orders').onDelete('CASCADE');
      table.integer('product_id').references('id').inTable('products');
      table.integer('quantity').notNullable();
      table.decimal('unit_price', 10, 2).notNullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.text('notes');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ Order Items table created');

    // Inventory Items
    await db.schema.dropTableIfExists('inventory_items');
    await db.schema.createTable('inventory_items', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('category');
      table.integer('current_stock').defaultTo(0);
      table.integer('minimum_stock').defaultTo(0);
      table.string('unit').notNullable(); // kg, pcs, liters, etc
      table.decimal('cost_per_unit', 10, 2);
      table.string('supplier');
      table.date('last_restock_date');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ Inventory Items table created');

    // Rooms
    await db.schema.dropTableIfExists('rooms');
    await db.schema.createTable('rooms', (table) => {
      table.increments('id').primary();
      table.string('room_number').notNullable().unique();
      table.string('room_type').notNullable(); // standard, deluxe, suite
      table.string('status').defaultTo('available'); // available, occupied, maintenance, cleaning
      table.integer('floor');
      table.decimal('price_per_night', 10, 2);
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ Rooms table created');

    // Tables
    await db.schema.dropTableIfExists('tables');
    await db.schema.createTable('tables', (table) => {
      table.increments('id').primary();
      table.string('table_number').notNullable().unique();
      table.integer('capacity');
      table.string('status').defaultTo('available'); // available, occupied, reserved
      table.string('location'); // indoor, outdoor, terrace
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ Tables table created');

    // Maintenance Requests
    await db.schema.dropTableIfExists('maintenance_requests');
    await db.schema.createTable('maintenance_requests', (table) => {
      table.increments('id').primary();
      table.integer('room_id').references('id').inTable('rooms');
      table.string('issue_type').notNullable();
      table.text('description');
      table.string('priority').defaultTo('medium'); // low, medium, high
      table.string('status').defaultTo('pending'); // pending, in_progress, completed
      table.integer('reported_by').references('id').inTable('staff');
      table.integer('assigned_to').references('id').inTable('staff');
      table.timestamp('reported_at').defaultTo(db.fn.now());
      table.timestamp('completed_at');
    });
    console.log('✅ Maintenance Requests table created');

    // Settings
    await db.schema.dropTableIfExists('settings');
    await db.schema.createTable('settings', (table) => {
      table.string('key').primary();
      table.text('value');
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('✅ Settings table created');

    // Insert default settings
    await db('settings').insert([
      { key: 'business_name', value: 'Maria Havens' },
      { key: 'tax_rate', value: '0.16' },
      { key: 'currency', value: 'KES' },
      { key: 'receipt_footer', value: 'Thank you for your business!' }
    ]);
    console.log('✅ Default settings inserted');

    console.log('\n🎉 All tables created successfully!');
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    await db.destroy();
    process.exit(1);
  }
}

createAllTables();
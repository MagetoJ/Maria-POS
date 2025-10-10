const knex = require('knex');
const path = require('path');

// Direct Knex configuration (matching your knexfile.ts)
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'database', 'pos.sqlite3')
  },
  useNullAsDefault: true,
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  }
});

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    console.log('📁 Database location:', path.resolve(__dirname, 'database', 'pos.sqlite3'));
    
    // Drop and recreate staff table
    const hasTable = await db.schema.hasTable('staff');
    if (hasTable) {
      console.log('⚠️  Dropping existing staff table...');
      await db.schema.dropTable('staff');
    }
    
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
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    console.log('✅ Staff table created successfully!');

    // Insert demo users
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
      }
    ]);

    console.log('✅ Demo users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   👤 Admin: admin / admin123 (PIN: 1234)');
    console.log('   👤 Manager: john.manager / manager123 (PIN: 5678)');
    console.log('   👤 Waiter: mary.waiter / waiter123 (PIN: 9012)');
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

setupDatabase();
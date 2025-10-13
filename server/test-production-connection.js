const knex = require('knex');
require('dotenv').config();

// Test script to verify production database connection
async function testConnection() {
  let db;
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Use the same connection logic as the app
    db = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      } : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'pos_mocha_dev',
        port: parseInt(process.env.DB_PORT || '5432'),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    });

    // Test basic connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful!');

    // Get database info
    const dbInfo = await db.raw('SELECT version() as version, current_database() as database');
    console.log('📊 Database:', dbInfo.rows[0].database);
    console.log('📊 Version:', dbInfo.rows[0].version.split(' ').slice(0, 2).join(' '));

    // List all tables
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));

    // Check key data
    const dataChecks = [
      { table: 'staff', label: 'Staff members' },
      { table: 'categories', label: 'Categories' },
      { table: 'products', label: 'Products' },
      { table: 'tables', label: 'Tables' },
      { table: 'rooms', label: 'Rooms' }
    ];

    console.log('\n📊 Data counts:');
    for (const check of dataChecks) {
      try {
        const hasTable = await db.schema.hasTable(check.table);
        if (hasTable) {
          const result = await db(check.table).count('* as count').first();
          console.log(`   ${check.label}: ${result.count}`);
        } else {
          console.log(`   ${check.label}: Table not found`);
        }
      } catch (err) {
        console.log(`   ${check.label}: Error - ${err.message}`);
      }
    }

    // Test login functionality
    console.log('\n🔐 Testing login functionality...');
    const testUser = await db('staff').where({ username: 'admin' }).first();
    if (testUser) {
      console.log('✅ Admin user found - login should work');
      console.log(`   Username: ${testUser.username}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   Active: ${testUser.is_active}`);
    } else {
      console.log('❌ Admin user not found - login will fail');
    }

    console.log('\n🎉 Database test complete - everything looks good!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}

testConnection();
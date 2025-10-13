const { Pool } = require('pg');

async function checkDatabase() {
  console.log('🔍 Checking database connection and tables...\n');
  
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.log('Please set DATABASE_URL with your Render PostgreSQL connection string');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Check if tables exist
    const tables = [
      'staff',
      'categories', 
      'products',
      'orders',
      'order_items',
      'tables',
      'rooms',
      'inventory',
      'settings',
      'shifts',
      'attendance',
      'room_transactions'
    ];
    
    console.log('📋 Checking tables:');
    const existingTables = [];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);
        
        const exists = result.rows[0].exists;
        if (exists) {
          existingTables.push(table);
          console.log(`✅ ${table}`);
        } else {
          console.log(`❌ ${table} - MISSING`);
        }
      } catch (error) {
        console.log(`❌ ${table} - Error checking: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Tables found: ${existingTables.length}/${tables.length}`);
    
    // Check if we have sample data
    if (existingTables.includes('staff')) {
      console.log('\n👥 Checking staff table structure:');
      const staffColumnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'staff'
        ORDER BY ordinal_position
      `);
      console.log('Staff table columns:');
      staffColumnsResult.rows.forEach(col => {
        console.log(`   • ${col.column_name} (${col.data_type})`);
      });
      
      console.log('\n👥 Checking staff data:');
      const staffResult = await pool.query('SELECT * FROM staff ORDER BY id LIMIT 5');
      if (staffResult.rows.length > 0) {
        console.log(`✅ Found ${staffResult.rows.length} staff members:`);
        staffResult.rows.forEach(staff => {
          console.log(`   • ${JSON.stringify(staff)}`);
        });
      } else {
        console.log('❌ No staff data found');
      }
    }
    
    if (existingTables.includes('categories')) {
      console.log('\n🏷️ Checking categories:');
      const categoriesResult = await pool.query('SELECT id, name FROM categories ORDER BY id');
      if (categoriesResult.rows.length > 0) {
        console.log(`✅ Found ${categoriesResult.rows.length} categories:`);
        categoriesResult.rows.forEach(category => {
          console.log(`   • ${category.name}`);
        });
      } else {
        console.log('❌ No category data found');
      }
    }
    
    if (existingTables.includes('products')) {
      console.log('\n🍽️ Checking products:');
      const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
      console.log(`✅ Found ${productsResult.rows[0].count} products`);
    }
    
    // Check database version
    console.log('\n🔧 Database info:');
    const versionResult = await pool.query('SELECT version()');
    console.log(`PostgreSQL: ${versionResult.rows[0].version.split(' ')[1]}`);
    
    // Check database size
    const sizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    console.log(`Database size: ${sizeResult.rows[0].size}`);
    
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your DATABASE_URL is correct and the database is running');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the check
checkDatabase().catch(console.error);
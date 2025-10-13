const { Pool } = require('pg');

async function checkTableStructure() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check products table structure
    console.log('🔍 Products table structure:');
    const productsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    
    productsResult.rows.forEach(col => {
      console.log(`   • ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    // Check tables table structure  
    console.log('\n🔍 Tables table structure:');
    const tablesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'tables'
      ORDER BY ordinal_position
    `);
    
    tablesResult.rows.forEach(col => {
      console.log(`   • ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    // Check rooms table structure  
    console.log('\n🔍 Rooms table structure:');
    const roomsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'rooms'
      ORDER BY ordinal_position
    `);
    
    roomsResult.rows.forEach(col => {
      console.log(`   • ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
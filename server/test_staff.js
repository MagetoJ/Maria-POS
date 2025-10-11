const knex = require('knex');
require('dotenv').config();

const config = {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_mocha_dev',
    ssl: false
  }
};

async function testStaff() {
  const db = knex(config);
  
  try {
    console.log('=== Checking Staff Table ===');
    
    // Check if staff table exists
    const tableExists = await db.schema.hasTable('staff');
    console.log('Staff table exists:', tableExists);
    
    if (tableExists) {
      // Get table schema
      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'staff' 
        ORDER BY ordinal_position;
      `);
      console.log('\nStaff table schema:');
      console.log(columns.rows);
      
      // Check for data
      const staffCount = await db('staff').count('id as count');
      console.log('\nTotal staff records:', staffCount[0].count);
      
      if (parseInt(staffCount[0].count) > 0) {
        // Show first few records
        const staffRecords = await db('staff').select('id', 'username', 'name', 'role', 'is_active').limit(3);
        console.log('\nSample staff records:');
        console.log(staffRecords);
        
        // Test specific admin user
        const adminUser = await db('staff').where({ username: 'admin', is_active: true }).first();
        console.log('\nAdmin user exists:', !!adminUser);
        if (adminUser) {
          console.log('Admin user details:', {
            id: adminUser.id,
            username: adminUser.username,
            name: adminUser.name,
            role: adminUser.role,
            hasPassword: !!adminUser.password
          });
        }
      }
    }
    
    console.log('\n✅ Staff table check completed');
    
  } catch (error) {
    console.error('❌ Error checking staff table:', error.message);
  } finally {
    await db.destroy();
  }
}

testStaff();
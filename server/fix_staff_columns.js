const knex = require('knex');
const knexfileExport = require('./dist/knexfile');
const config = knexfileExport.default.development;
// Disable SSL for the database connection
config.connection.ssl = false;
const db = knex(config);

async function fixDatabase() {
  try {
    // Check if username column exists
    const hasUsernameColumn = await db.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'username'
      );
    `);
    
    console.log('Has username column:', hasUsernameColumn.rows[0].exists);
    
    if (!hasUsernameColumn.rows[0].exists) {
      console.log('Adding username and password columns...');
      await db.raw(`
        ALTER TABLE staff ADD COLUMN IF NOT EXISTS username TEXT;
        ALTER TABLE staff ADD COLUMN IF NOT EXISTS password TEXT;
      `);
      
      await db('staff').update({
        username: db.raw(`CASE 
          WHEN role = 'admin' THEN 'admin_' || id::text
          ELSE LOWER(REPLACE(name, ' ', '')) || '_' || id::text
        END`),
        password: 'password123'
      }).whereNull('username');
      
      await db.raw(`
        ALTER TABLE staff ALTER COLUMN username SET NOT NULL;
        ALTER TABLE staff ALTER COLUMN password SET NOT NULL;
        DROP INDEX IF EXISTS idx_staff_username;
        CREATE INDEX idx_staff_username ON staff(username);
      `);
      
      console.log('✅ Added username and password columns');
    }
    
    // Check staff records
    const staff = await db('staff').select('*');
    console.log('Staff records:');
    staff.forEach(s => console.log(`  - ${s.name} (${s.username})`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixDatabase();
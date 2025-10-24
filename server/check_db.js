const knex = require('knex');
const config = require('./knexfile.js');

async function checkDatabase() {
  const db = knex(config.development);
  
  try {
    // Check if categories table exists
    const hasTable = await db.schema.hasTable('categories');
    console.log('Categories table exists:', hasTable);
    
    if (hasTable) {
      // Get table schema
      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        ORDER BY ordinal_position;
      `);
      console.log('Categories table columns:', columns.rows);
    }
    
  } catch (error) {
    console.error('Database check error:', error);
  } finally {
    await db.destroy();
  }
}

checkDatabase();
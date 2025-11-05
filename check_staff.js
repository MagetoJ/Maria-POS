const knex = require('knex');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'pos_mocha_dev',
    port: parseInt(process.env.DB_PORT || '5432'),
  }
});

(async () => {
  try {
    const staff = await db('staff').select('*');
    console.log('Staff records:', JSON.stringify(staff, null, 2));
    console.log('Total staff members:', staff.length);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.destroy();
  }
})();
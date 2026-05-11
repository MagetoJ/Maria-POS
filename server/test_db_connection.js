// server/test_db_connection.js
const knex = require('knex');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.production
dotenv.config({ path: path.join(__dirname, '.env.production') });

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL, // Use EXTERNAL_DATABASE_URL if defined, otherwise DATABASE_URL
    ssl: { rejectUnauthorized: false } // Required for Render's external connections
  }
});

async function testDbConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await db.destroy();
  }
}

testDbConnection();
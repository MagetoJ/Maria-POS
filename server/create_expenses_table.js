const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_mocha_dev',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function createExpensesTable() {
  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('📝 Creating expenses table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          vendor TEXT,
          payment_method TEXT DEFAULT 'cash',
          receipt_number TEXT UNIQUE,
          notes TEXT,
          created_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Expenses table created successfully');

      console.log('📑 Creating indexes...');
      await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by)`);
      console.log('✅ Indexes created successfully');

      console.log('✅ All done!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createExpensesTable();
#!/usr/bin/env node
/**
 * Script to create missing database tables (user_sessions and product_returns)
 * These tables are required for the admin and product-returns endpoints
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function createMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating missing database tables...');
    
    // Create user_sessions table
    console.log('📝 Creating user_sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES staff(id),
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logout_time TIMESTAMP,
        session_token TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
    `);
    console.log('✅ user_sessions table created successfully');

    // Create product_returns table
    console.log('📝 Creating product_returns table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_returns (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        inventory_id INTEGER REFERENCES inventory_items(id),
        quantity_returned INTEGER NOT NULL,
        reason TEXT NOT NULL,
        refund_amount DECIMAL(10, 2),
        notes TEXT,
        created_by INTEGER REFERENCES staff(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_product_returns_order_id ON product_returns(order_id);
      CREATE INDEX IF NOT EXISTS idx_product_returns_product_id ON product_returns(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_returns_created_by ON product_returns(created_by);
      CREATE INDEX IF NOT EXISTS idx_product_returns_inventory_id ON product_returns(inventory_id);
    `);
    console.log('✅ product_returns table created successfully');

    console.log('\n✨ All missing tables created successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'EEXIST' || error.message.includes('already exists')) {
      console.log('⚠️  Tables already exist, skipping creation');
      process.exit(0);
    }
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createMissingTables();
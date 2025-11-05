#!/usr/bin/env node
/**
 * Script to create missing audit_logs table
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function createAuditLogsTable() {
  const client = await pool.connect();
  
  try {
    console.log('📝 Creating audit_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        action TEXT NOT NULL,
        old_values JSONB,
        new_values JSONB,
        changed_by INTEGER REFERENCES staff(id),
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    `);
    console.log('✅ audit_logs table created successfully');

    console.log('\n✨ All tables are ready!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'EEXIST' || error.message.includes('already exists')) {
      console.log('⚠️  audit_logs table already exists, skipping creation');
      process.exit(0);
    }
    console.error('❌ Error creating table:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAuditLogsTable();
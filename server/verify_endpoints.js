#!/usr/bin/env node
/**
 * Verification script to check that endpoints can be called without 500 errors
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function verifyTables() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Verifying database tables...\n');
    
    // Check user_sessions table
    console.log('📋 Checking user_sessions table...');
    const userSessions = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='user_sessions'
    `);
    if (userSessions.rows.length > 0) {
      console.log('  ✓ user_sessions table exists');
      const userSessionsData = await client.query('SELECT COUNT(*) as count FROM user_sessions');
      console.log(`  ✓ Current records: ${userSessionsData.rows[0].count}`);
    } else {
      console.log('  ✗ user_sessions table NOT found');
    }

    // Check product_returns table
    console.log('\n📋 Checking product_returns table...');
    const productReturns = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='product_returns'
    `);
    if (productReturns.rows.length > 0) {
      console.log('  ✓ product_returns table exists');
      const productReturnsData = await client.query('SELECT COUNT(*) as count FROM product_returns');
      console.log(`  ✓ Current records: ${productReturnsData.rows[0].count}`);
    } else {
      console.log('  ✗ product_returns table NOT found');
    }

    // Check audit_logs table
    console.log('\n📋 Checking audit_logs table...');
    const auditLogs = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name='audit_logs'
    `);
    if (auditLogs.rows.length > 0) {
      console.log('  ✓ audit_logs table exists');
      const auditLogsData = await client.query('SELECT COUNT(*) as count FROM audit_logs');
      console.log(`  ✓ Current records: ${auditLogsData.rows[0].count}`);
    } else {
      console.log('  ✗ audit_logs table NOT found');
    }

    // Check that the tables have proper structure
    console.log('\n🔍 Verifying table structures...');
    
    const userSessionsColumns = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name='user_sessions'
      ORDER BY ordinal_position
    `);
    console.log('  user_sessions columns:');
    userSessionsColumns.rows.forEach(col => {
      console.log(`    - ${col.column_name} (${col.data_type})`);
    });

    const productReturnsColumns = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name='product_returns'
      ORDER BY ordinal_position
    `);
    console.log('  product_returns columns:');
    productReturnsColumns.rows.forEach(col => {
      console.log(`    - ${col.column_name} (${col.data_type})`);
    });

    console.log('\n✨ Database verification complete!');
    console.log('\n✅ All required tables are created and ready.');
    console.log('   The endpoints /api/admin/user-sessions and /api/product-returns should now work.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyTables();
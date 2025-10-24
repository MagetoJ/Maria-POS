import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://mariahavens_user:BvEnYG8hb7baKudACcyxLuGkNgpxqloT@dpg-d3l72s3uibrs73cf7l60-a.oregon-postgres.render.com/mariahavens',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runDatabaseUpdate() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Connected to database');
    
    // Read SQL script
    const sqlPath = path.join(__dirname, 'server', 'update_menu.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Running SQL update script...');
    
    // Split SQL into individual statements and execute
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await client.query(statement);
          if (statement.toLowerCase().includes('select')) {
            const result = await client.query(statement);
            console.log('Query result:', result.rows);
          }
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} error (may be expected):`, error.message);
        }
      }
    }
    
    // Verify the update
    console.log('\n📊 Verifying update...');
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM categories');
    const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
    
    console.log(`✅ Categories: ${categoriesResult.rows[0].count}`);
    console.log(`✅ Products: ${productsResult.rows[0].count}`);
    
    // Show sample data
    console.log('\n🔍 Sample categories:');
    const sampleCategories = await client.query('SELECT name, description FROM categories ORDER BY display_order LIMIT 5');
    sampleCategories.rows.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description}`);
    });
    
    console.log('\n🔍 Sample products:');
    const sampleProducts = await client.query(`
      SELECT p.name, c.name as category, p.price 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      ORDER BY p.id LIMIT 10
    `);
    sampleProducts.rows.forEach(prod => {
      console.log(`  - ${prod.name} (${prod.category}): KES ${prod.price}`);
    });
    
    console.log('\n✅ Database update completed successfully!');
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runDatabaseUpdate();
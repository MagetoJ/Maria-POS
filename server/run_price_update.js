const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://mariahavens_user:BvEnYG8hb7baKudACcyxLuGkNgpxqloT@dpg-d3l72s3uibrs73cf7l60-a.oregon-postgres.render.com/mariahavens',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runPriceUpdate() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Connected to database');
    
    // Read SQL script
    const sqlPath = path.join(__dirname, 'price_update.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.log('❌ Price update SQL file not found. Please run the Python price update script first.');
      console.log('   Run: python update_prices_from_text.py');
      return;
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Running price update SQL script...');
    console.log('⚠️  This will update product prices in the database');
    
    // Execute the SQL script as a transaction
    try {
      await client.query(sql);
      console.log('✅ Price update completed successfully!');
      
      // Get summary of changes
      console.log('\n📊 Getting update summary...');
      const summaryResult = await client.query(`
        SELECT COUNT(*) as total_products,
               MIN(price) as min_price,
               MAX(price) as max_price,
               AVG(price) as avg_price
        FROM products 
        WHERE price > 0
      `);
      
      const summary = summaryResult.rows[0];
      console.log(`   Total products: ${summary.total_products}`);
      console.log(`   Price range: KES ${parseFloat(summary.min_price).toFixed(0)} - KES ${parseFloat(summary.max_price).toLocaleString()}`);
      console.log(`   Average price: KES ${parseFloat(summary.avg_price).toFixed(0)}`);
      
      // Show some updated products
      console.log('\n🔍 Recently updated products:');
      const recentUpdates = await client.query(`
        SELECT p.name, c.name as category, p.price 
        FROM products p 
        JOIN categories c ON p.category_id = c.id 
        WHERE p.updated_at > NOW() - INTERVAL '5 minutes'
        ORDER BY p.updated_at DESC 
        LIMIT 10
      `);
      
      recentUpdates.rows.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.category}): KES ${parseFloat(product.price).toLocaleString()}`);
      });
      
    } catch (error) {
      console.error('❌ Error executing price update:', error.message);
      console.log('   The transaction has been rolled back');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Check if this is being run directly
if (require.main === module) {
  console.log('🚀 Starting price update process...');
  console.log('📋 This will update product prices based on the generated SQL script');
  console.log('');
  
  runPriceUpdate().catch(console.error);
}

module.exports = { runPriceUpdate };
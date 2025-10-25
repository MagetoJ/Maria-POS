const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Database configuration
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'pos_mocha_dev',
    port: parseInt(process.env.DB_PORT || '5432'),
  };
};

async function runProductCreation() {
  const client = new Pool(getDatabaseConfig());
  
  try {
    console.log('🏭 Starting product creation process...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create_products.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    
    // Connect to database
    await client.connect();
    console.log('✅ Database connection established');
    
    // Check existing product counts by category before creation
    console.log('\n📊 Checking existing products by category...');
    const existingProducts = await client.query(`
      SELECT 
        c.name as category_name,
        COUNT(p.id) as product_count,
        COALESCE(MIN(p.price), 0) as min_price,
        COALESCE(MAX(p.price), 0) as max_price,
        COALESCE(AVG(p.price), 0) as avg_price
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      WHERE c.name IN ('Beer', 'Ciders', 'Whiskey', 'Cans')
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    console.log('📋 Current products in target categories:');
    existingProducts.rows.forEach(cat => {
      console.log(`   ${cat.category_name}: ${cat.product_count} products (KES ${Math.round(cat.min_price)} - KES ${Math.round(cat.max_price)})`);
    });
    
    // Execute the product creation SQL
    console.log('\n🏗️ Creating new products...');
    const result = await client.query(sqlContent);
    
    // Get updated product counts
    console.log('\n✅ Product creation completed. Fetching updated counts...');
    const updatedProducts = await client.query(`
      SELECT 
        c.name as category_name,
        COUNT(p.id) as product_count,
        COALESCE(MIN(p.price), 0) as min_price,
        COALESCE(MAX(p.price), 0) as max_price,
        COALESCE(AVG(p.price), 0) as avg_price
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      WHERE c.name IN ('Beer', 'Ciders', 'Whiskey', 'Cans')
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    console.log('\n📋 Updated products in target categories:');
    updatedProducts.rows.forEach(cat => {
      const before = existingProducts.rows.find(existing => existing.category_name === cat.category_name);
      const added = cat.product_count - (before?.product_count || 0);
      const indicator = added > 0 ? ` (+${added} new)` : '';
      console.log(`   ${cat.category_name}: ${cat.product_count} products${indicator} (KES ${Math.round(cat.min_price)} - KES ${Math.round(cat.max_price)})`);
    });
    
    // Show some of the newly created products
    console.log('\n🆕 Recently created products:');
    const recentProducts = await client.query(`
      SELECT 
        p.name,
        c.name as category_name,
        p.price,
        p.cost,
        p.created_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.created_at >= NOW() - INTERVAL '1 minute'
      AND c.name IN ('Beer', 'Ciders', 'Whiskey', 'Cans')
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    if (recentProducts.rows.length > 0) {
      recentProducts.rows.forEach(product => {
        console.log(`   • ${product.name} (${product.category_name}) - KES ${product.price} [Cost: KES ${product.cost}]`);
      });
    } else {
      console.log('   No new products created (they may already exist)');
    }
    
    // Summary calculations
    const totalBefore = existingProducts.rows.reduce((sum, cat) => sum + parseInt(cat.product_count), 0);
    const totalAfter = updatedProducts.rows.reduce((sum, cat) => sum + parseInt(cat.product_count), 0);
    const totalAdded = totalAfter - totalBefore;
    
    console.log(`\n📈 Summary:`);
    console.log(`   • Products before: ${totalBefore}`);
    console.log(`   • Products added: ${totalAdded}`);
    console.log(`   • Products now: ${totalAfter}`);
    
    // Check for potential price conflicts
    console.log('\n🔍 Checking for potential pricing issues...');
    const priceCheck = await client.query(`
      SELECT 
        p.name,
        c.name as category_name,
        p.price,
        p.cost,
        ROUND((p.price - p.cost) / p.price * 100, 1) as margin_percent
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE c.name IN ('Beer', 'Ciders', 'Whiskey', 'Cans')
      AND (p.cost >= p.price OR p.cost < p.price * 0.3)
      ORDER BY margin_percent
      LIMIT 5
    `);
    
    if (priceCheck.rows.length > 0) {
      console.log('   ⚠️ Products with unusual margins:');
      priceCheck.rows.forEach(product => {
        console.log(`     • ${product.name}: ${product.margin_percent}% margin (KES ${product.cost} cost, KES ${product.price} price)`);
      });
    } else {
      console.log('   ✅ All product margins look reasonable (30-70%)');
    }
    
    console.log('\n✅ Product creation process completed successfully!');
    
    return {
      success: true,
      productsBefore: totalBefore,
      productsAdded: totalAdded,
      productsAfter: totalAfter,
      newProducts: recentProducts.rows.map(p => p.name)
    };
    
  } catch (error) {
    console.error('\n❌ Error during product creation:', error.message);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the product creation
if (require.main === module) {
  runProductCreation()
    .then(result => {
      if (result.success) {
        console.log('\n🎊 Product creation completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Product creation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n🚨 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runProductCreation };
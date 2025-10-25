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

async function runCategoryCreation() {
  const client = new Pool(getDatabaseConfig());
  
  try {
    console.log('🔄 Starting category creation process...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create_categories.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    
    // Connect to database
    await client.connect();
    console.log('✅ Database connection established');
    
    // Check existing categories before creation
    console.log('\n📊 Checking existing categories...');
    const existingCategories = await client.query(
      'SELECT id, name, description, is_active, display_order FROM categories ORDER BY display_order, name'
    );
    
    if (existingCategories.rows.length > 0) {
      console.log('📋 Existing categories:');
      existingCategories.rows.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name} (ID: ${cat.id}, Order: ${cat.display_order}, Active: ${cat.is_active})`);
      });
    } else {
      console.log('   No existing categories found');
    }
    
    // Execute the category creation SQL
    console.log('\n🏗️ Creating new categories...');
    const result = await client.query(sqlContent);
    
    // Get updated categories list
    console.log('\n✅ Category creation completed. Fetching updated list...');
    const updatedCategories = await client.query(
      'SELECT id, name, description, is_active, display_order, created_at FROM categories ORDER BY display_order, name'
    );
    
    console.log('\n📋 All categories after creation:');
    updatedCategories.rows.forEach((cat, index) => {
      const isNew = !existingCategories.rows.find(existing => existing.name === cat.name);
      const indicator = isNew ? ' 🆕' : '';
      console.log(`   ${index + 1}. ${cat.name}${indicator}`);
      console.log(`      Description: ${cat.description || 'No description'}`);
      console.log(`      ID: ${cat.id}, Order: ${cat.display_order}, Active: ${cat.is_active}`);
      console.log(`      Created: ${new Date(cat.created_at).toLocaleDateString()}`);
      console.log('');
    });
    
    // Summary
    const newCategories = updatedCategories.rows.filter(cat => 
      !existingCategories.rows.find(existing => existing.name === cat.name)
    );
    
    console.log(`\n📈 Summary:`);
    console.log(`   • Total categories before: ${existingCategories.rows.length}`);
    console.log(`   • New categories created: ${newCategories.length}`);
    console.log(`   • Total categories now: ${updatedCategories.rows.length}`);
    
    if (newCategories.length > 0) {
      console.log(`\n🎉 New categories created:`);
      newCategories.forEach(cat => {
        console.log(`   • ${cat.name} - ${cat.description}`);
      });
    }
    
    // Verification: Check if any products can now be matched
    console.log('\n🔍 Checking for potential product matches with new categories...');
    
    // This would need access to the unmatched products data to provide better insights
    console.log('   New categories are now available for product assignment');
    console.log('   Consider updating the product creation/import process to use these categories');
    
    console.log('\n✅ Category creation process completed successfully!');
    
    return {
      success: true,
      existingCount: existingCategories.rows.length,
      newCount: newCategories.length,
      totalCount: updatedCategories.rows.length,
      newCategories: newCategories.map(cat => cat.name)
    };
    
  } catch (error) {
    console.error('\n❌ Error during category creation:', error.message);
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

// Run the category creation
if (require.main === module) {
  runCategoryCreation()
    .then(result => {
      if (result.success) {
        console.log('\n🎊 Category creation completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Category creation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n🚨 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runCategoryCreation };
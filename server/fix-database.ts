// Create a new file: server/fix-database.ts
// Run this directly to fix your database

import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Try multiple possible paths
const possiblePaths = [
  path.resolve(__dirname, '../database/pos.sqlite3'),
  path.resolve(__dirname, './database/pos.sqlite3'),
  path.resolve(process.cwd(), 'database/pos.sqlite3'),
  path.resolve(process.cwd(), '../database/pos.sqlite3'),
];

let dbPath = possiblePaths[0];
const fs = require('fs');

// Find the correct path
for (const p of possiblePaths) {
  console.log('Checking path:', p);
  if (fs.existsSync(p)) {
    dbPath = p;
    console.log('✅ Found database at:', dbPath);
    break;
  }
}

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true
});

async function fixDatabase() {
  try {
    console.log('🔧 Starting database fix...\n');

    // Fix categories table
    console.log('📋 Checking categories table...');
    const categoriesInfo = await db.raw("PRAGMA table_info(categories)");
    const categoriesColumns = categoriesInfo.map((col: any) => col.name);
    console.log('Current columns:', categoriesColumns.join(', '));

    if (!categoriesColumns.includes('display_order')) {
      console.log('➕ Adding display_order column...');
      await db.raw('ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0');
      
      // Update existing categories
      const categories = await db('categories').select('*');
      for (let i = 0; i < categories.length; i++) {
        await db('categories').where({ id: categories[i].id }).update({ display_order: i + 1 });
      }
      console.log('✅ Added display_order and updated existing categories\n');
    } else {
      console.log('✅ display_order already exists\n');
    }

    if (!categoriesColumns.includes('is_active')) {
      console.log('➕ Adding is_active column to categories...');
      await db.raw('ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1');
      console.log('✅ Added is_active\n');
    }

    // Fix products table
    console.log('📦 Checking products table...');
    const productsInfo = await db.raw("PRAGMA table_info(products)");
    const productsColumns = productsInfo.map((col: any) => col.name);
    console.log('Current columns:', productsColumns.join(', '));

    if (!productsColumns.includes('is_active')) {
      console.log('➕ Adding is_active column to products...');
      await db.raw('ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1');
      await db('products').update({ is_active: 1 });
      console.log('✅ Added is_active\n');
    } else {
      console.log('✅ is_active already exists\n');
    }

    if (!productsColumns.includes('cost')) {
      console.log('➕ Adding cost column to products...');
      await db.raw('ALTER TABLE products ADD COLUMN cost REAL DEFAULT 0');
      await db('products').update({ cost: 0 });
      console.log('✅ Added cost\n');
    } else {
      console.log('✅ cost already exists\n');
    }

    // Verify changes
    console.log('🔍 Verifying changes...');
    const newCategoriesInfo = await db.raw("PRAGMA table_info(categories)");
    const newProductsInfo = await db.raw("PRAGMA table_info(products)");
    
    console.log('\n✅ Categories columns:', newCategoriesInfo.map((col: any) => col.name).join(', '));
    console.log('✅ Products columns:', newProductsInfo.map((col: any) => col.name).join(', '));

    console.log('\n🎉 Database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    await db.destroy();
    process.exit();
  }
}

fixDatabase();
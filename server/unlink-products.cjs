// server/unlink-products.cjs
const knex = require('knex');
// UPDATED: Changed path because script is now inside the server folder alongside knexfile.js
const knexConfig = require('./knexfile.js'); 

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
  console.error(`❌ Error: Configuration for environment "${environment}" was not found in knexfile.js.`);
  process.exit(1);
}

const db = knex(config);

async function unlinkAllProducts() {
  console.log('🔄 Connecting to database to unlink products from inventory items...');
  try {
    const countResult = await db('products').whereNotNull('inventory_item_id').count('* as count').first();
    const linkedCount = parseInt(countResult.count || '0', 10);
    
    if (linkedCount === 0) {
      console.log('ℹ️ No products are currently linked to any inventory items. Nothing to change.');
      process.exit(0);
    }

    console.log(`Found ${linkedCount} products currently linked to inventory items.`);

    await db.transaction(async (trx) => {
      const updatedRows = await trx('products')
        .whereNotNull('inventory_item_id')
        .update({
          inventory_item_id: null,
          updated_at: new Date()
        });

      console.log(`✅ Successfully unlinked ${updatedRows} products from the inventory table.`);
    });

    console.log('🎉 Database modification complete.');
  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
  } finally {
    await db.destroy();
    console.log('🔌 Database connection closed.');
  }
}

unlinkAllProducts();
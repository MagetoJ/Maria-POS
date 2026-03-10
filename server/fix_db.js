const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }
});

async function fix() {
  try {
    const hasColumn = await db.schema.hasColumn('order_items', 'inventory_item_id');
    if (!hasColumn) {
      console.log('Adding inventory_item_id to order_items...');
      await db.schema.alterTable('order_items', (table) => {
        table.integer('inventory_item_id').unsigned().references('id').inTable('inventory_items').onDelete('SET NULL');
      });
      console.log('✅ Added inventory_item_id column');
    } else {
      console.log('✅ inventory_item_id column already exists');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing database:', err);
    process.exit(1);
  }
}

fix();

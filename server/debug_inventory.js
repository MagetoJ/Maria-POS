const knex = require('knex');
const path = require('path');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.DATABASE_USER || process.env.DB_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || process.env.DB_NAME || 'pos_mocha_dev',
    port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432'),
  }
});

async function run() {
  try {
    const categories = await db('categories').select('*');
    console.log('Categories:', categories.map(c => ({ id: c.id, name: c.name })));

    const inventoryItems = await db('inventory_items').select('*').limit(20);
    console.log('Inventory Items (First 20):', inventoryItems.map(i => ({ id: i.id, name: i.name, category: i.category })));

    const products = await db('products').select('*').limit(20);
    console.log('Products (First 20):', products.map(p => ({ id: p.id, name: p.name, inventory_item_id: p.inventory_item_id })));

    const unlinkedInventory = await db('inventory_items')
      .leftJoin('products', 'inventory_items.id', 'products.inventory_item_id')
      .whereNull('products.id')
      .select('inventory_items.*');
    
    console.log('Unlinked Inventory Items Count:', unlinkedInventory.length);
    console.log('Sample Unlinked Inventory:', unlinkedInventory.slice(0, 10).map(i => ({ id: i.id, name: i.name, category: i.category })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

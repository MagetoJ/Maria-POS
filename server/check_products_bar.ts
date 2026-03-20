import db from './src/db';

async function run() {
  try {
    const products = await db('products')
      .leftJoin('inventory_items', 'products.inventory_item_id', 'inventory_items.id')
      .select('products.id', 'products.name', 'products.inventory_item_id', 'inventory_items.inventory_type')
      .where('inventory_items.inventory_type', 'bar')
      .orWhere('products.category_id', 3); // Assuming 3 is Bar category based on previous Turn
    
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

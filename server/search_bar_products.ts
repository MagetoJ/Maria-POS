import db from './src/db';

async function run() {
  try {
    const products = await db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select('products.id', 'products.name', 'categories.name as category_name', 'products.category_id')
      .whereRaw('LOWER(products.name) LIKE ?', ['%beer%'])
      .orWhereRaw('LOWER(products.name) LIKE ?', ['%soda%'])
      .orWhereRaw('LOWER(products.name) LIKE ?', ['%wine%'])
      .orWhereRaw('LOWER(products.name) LIKE ?', ['%water%'])
      .orWhereRaw('LOWER(categories.name) LIKE ?', ['%bar%'])
      .orWhereRaw('LOWER(categories.name) LIKE ?', ['%drink%']);
    
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

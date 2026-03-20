import db from './src/db';

async function run() {
  try {
    const products = await db('products').where('category_id', '>', 17).select('*');
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

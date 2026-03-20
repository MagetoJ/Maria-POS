import db from './src/db';

async function run() {
  try {
    const items = await db('inventory_items').where('inventory_type', 'bar').select('*');
    console.log(JSON.stringify(items, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

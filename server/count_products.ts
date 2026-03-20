import db from './src/db';

async function run() {
  try {
    const res = await db('products').count('* as count').first();
    console.log(res?.count);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

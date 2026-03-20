import db from './src/db';

async function run() {
  try {
    const cats = await db('categories').select('*').orderBy('id', 'asc');
    console.log(JSON.stringify(cats, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

const db = require('./server/dist/db').default;

async function checkSettings() {
  try {
    const settings = await db('settings').select('*');
    console.log(JSON.stringify(settings, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSettings();

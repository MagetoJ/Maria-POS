const db = require('./src/db').default;
db.raw("SELECT * FROM inventory_log WHERE action = 'sale' ORDER BY created_at DESC LIMIT 10")
  .then(res => {
    console.log(JSON.stringify(res.rows || res, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

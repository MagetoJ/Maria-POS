const knex = require('knex')(require('./knexfile').development);

async function checkStructure() {
  try {
    const tables = ['settings', 'tables', 'categories'];
    for (const table of tables) {
      const exists = await knex.schema.hasTable(table);
      if (exists) {
        console.log(`Table ${table} exists. Columns:`);
        const columns = await knex.raw(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?`, [table]);
        console.log(columns.rows.map(c => `${c.column_name} (${c.data_type})`));
      } else {
        console.log(`Table ${table} does not exist.`);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStructure();

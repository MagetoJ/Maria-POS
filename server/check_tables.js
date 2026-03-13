const knex = require('knex')(require('./knexfile').production);

async function checkTables() {
  try {
    const result = await knex.raw("SELECT n.nspname as schema, c.relname as name, c.relkind as type FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname IN ('shifts', 'expenses')");
    console.log('Relations with name shifts or expenses:', result.rows);
    const tables = await knex.raw("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')");
    console.log('All tables:', tables.rows.map(r => `${r.table_schema}.${r.table_name}`));
    process.exit(0);
  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  }
}

checkTables();

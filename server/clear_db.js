const knex = require('knex')(require('./knexfile').development);

async function clearDatabase() {
  try {
    const tables = await knex.raw("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tables to drop:', tables.rows.map(r => r.tablename));
    
    for (const row of tables.rows) {
      await knex.raw(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
      console.log(`Dropped ${row.tablename}`);
    }
    
    const types = await knex.raw("SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e'");
    for (const row of types.rows) {
        await knex.raw(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
        console.log(`Dropped type ${row.typname}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();

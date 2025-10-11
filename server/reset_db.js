const { Client } = require('pg');

async function resetDatabase() {
  const client = new Client({
    host: '127.0.0.1',
    user: 'postgres',
    password: 'postgres',
    database: 'pos_mocha_dev',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Drop all tables
    const dropTablesQuery = `
      DROP TABLE IF EXISTS maintenance_requests CASCADE;
      DROP TABLE IF EXISTS order_item_variations CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS inventory_items CASCADE;
      DROP TABLE IF EXISTS product_variations CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS tables CASCADE;
      DROP TABLE IF EXISTS rooms CASCADE;
      DROP TABLE IF EXISTS staff CASCADE;
      DROP TABLE IF EXISTS knex_migrations CASCADE;
      DROP TABLE IF EXISTS knex_migrations_lock CASCADE;
    `;

    await client.query(dropTablesQuery);
    console.log('All tables dropped successfully');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

resetDatabase();
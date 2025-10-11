import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'postgres', // change if you set a different password
    database: 'pos_mocha_dev',
    port: 5432,
    ssl: false, // make sure SSL is false locally
  },
});

db.raw('select 1+1 as result')
  .then(() => console.log('✅ Database connected successfully'))
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });

export default db;

import type { Knex } from 'knex';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pos_mocha_dev';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      connectionString: databaseUrl,
      ssl: false, // Disable SSL locally
    },
    migrations: {
      directory: path.resolve(__dirname, '../migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, '../seeds'),
    },
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }, // Enable SSL for hosted DBs
    },
    migrations: {
      directory: path.resolve(__dirname, '../migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, '../seeds'),
    },
  },
};

export default config;

import type { Knex } from 'knex';
import path from 'path';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database', 'pos.sqlite'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations',
    },
    seeds: { // <-- ADD THIS BLOCK
      directory: './seeds',
    },
  },
};

export default config;
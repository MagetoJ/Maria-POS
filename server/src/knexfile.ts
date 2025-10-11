import type { Knex } from 'knex';
import path from 'path';

// I have placed your Render database URL here.
const databaseUrl = 'postgresql://mariahavens_user:BvEnYG8hb7baKudACcyxLuGkNgpxqloT@dpg-d3l72s3uibrs73cf7l60-a.oregon-postgres.render.com/mariahavens';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: databaseUrl,
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    },
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false } // This is important for Render connections
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    }
  },
};

export default config;
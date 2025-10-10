import type { Knex } from "knex";
import path from "path";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: path.resolve(__dirname, "database", "pos.sqlite"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, "migrations"),
      extension: "ts",
    },
    seeds: {
      directory: path.resolve(__dirname, "seeds"),
      extension: "ts",
    },
  },

  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.resolve(__dirname, "migrations"),
      extension: "js", // Compiled output
    },
    seeds: {
      directory: path.resolve(__dirname, "seeds"),
      extension: "js", // Compiled output
    },
  },
};

export default config;

import path from "path";
import dotenv from "dotenv";
import { AsyncLocalStorage } from "async_hooks";
import type { Knex } from "knex";

dotenv.config();

// Constants
export const base_dir = path.resolve(__dirname, "..");
export const stage = process.env.NODE_ENV || "development";
export const is_production = process.env.NODE_ENV === "production";
export const port = parseInt(process.env.PORT || "8000");

// Environment
dotenv.config({
  path: path.resolve(base_dir, "src", "env", `.env.${stage}`),
});

// AsyncLocalStorage
export const asyncLocalStorage = new AsyncLocalStorage();

// Database

export const DB_HOST = process.env.DB_HOST as string;
export const DB_NAME = process.env.DB_NAME as string;
export const DB_USER = process.env.DB_USER as string;
export const DB_PASSWORD = process.env.DB_PASSWORD as string;
export const DB_PORT = parseInt(process.env.DB_PORT || "5432");

// Knex Config

const connection: Knex.PgConnectionConfig = {
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
};
export const knexConfig = {
  [stage]: {
    client: "pg",
    connection: connection,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: path.resolve(base_dir, "src", "database", "migrations"),
    },
    seeds: {
      directory: path.resolve(base_dir, "src", "database", "seeds"),
    },
  },
};

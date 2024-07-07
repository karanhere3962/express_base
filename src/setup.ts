import path from "path";
import dotenv from "dotenv";
import { AsyncLocalStorage } from "async_hooks";
import type { Knex } from "knex";
import knex from "knex";
import createLogger from "./logger";

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
export const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

// Database
export const DB_HOST = process.env.DB_HOST as string;
export const DB_NAME = process.env.DB_NAME as string;
export const DB_USER = process.env.DB_USER as string;
export const DB_PASSWORD = process.env.DB_PASSWORD as string;
export const DB_PORT = parseInt(process.env.DB_PORT || "5432");

// Knex Config
export const knexClient = process.env.KNEX_CLIENT || "pg";

export const pgConnectionConfig: Knex.PgConnectionConfig = {
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
};

export const commonConfig = {
  migrations: {
    tableName: "knex_migrations",
    directory: path.resolve(base_dir, "src", "database", "migrations"),
  },
  seeds: {
    directory: path.resolve(base_dir, "src", "database", "seeds"),
  },
};

export const commonPGConfig: Knex.Config = {
  client: "pg",
  connection: pgConnectionConfig,
  pool: {
    min: 2,
    max: 10,
  },
  ...commonConfig,
};

export const commonSQLite3Config = {
  client: "sqlite3",
  connection: {
    filename: path.resolve(base_dir, "src", "localScripts", "dev.sqlite3"), // Path to your SQLite database file
  },
  useNullAsDefault: true,
  ...commonConfig,
};

const config = knexClient === "pg" ? commonPGConfig : commonSQLite3Config;

export const knexConfig = {
  [stage]: config,
};

export const db = knex(config);
export const getKnex = () => db;
export const getTenantSchemaNames = () => ["test_tenant"];

// Logger
export const logger = createLogger({
  stage,
  loggingDir: "logs",
  retentionPeriod: "45d",
  logLevel: stage === "development" ? "debug" : "info",
});

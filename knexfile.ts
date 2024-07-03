import type { Knex } from "knex";
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_USER,
  DB_PORT,
  stage,
} from "./src/setup";

const connection: Knex.PgConnectionConfig = {
  host: DB_HOST as string,
  database: DB_NAME as string,
  user: DB_USER as string,
  password: DB_PASSWORD as string,
  port: DB_PORT,
};

const commonConfig = {
  client: "pg",
  connection,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "database/migrations",
  },
  seeds: {
    directory: "database/seeds",
  },
};

export default {
  [stage]: commonConfig,
};

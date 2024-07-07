import { Knex } from "knex";
import { logger } from "../../../setup";

const tenantSchema = process.env.TENANT_SCHEMA || "public";
logger.debug("Running migration in schema:", tenantSchema);

exports.up = async (knex: Knex) => {
  // TODO: write migration here
  await knex.raw("CREATE SCHEMA IF NOT EXISTS " + tenantSchema);
  return knex.schema.withSchema(tenantSchema);
};

exports.down = async (knex: Knex) => {
  // TODO: write rollback here
  return knex.schema.withSchema(tenantSchema);
};

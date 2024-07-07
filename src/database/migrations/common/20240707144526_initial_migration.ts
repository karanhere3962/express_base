import { Knex } from "knex";
import { logger } from "../../../setup";

const tenantSchema = process.env.TENANT_SCHEMA || "public";
logger.debug("Running migration in schema:", tenantSchema);

exports.up = async (knex: Knex) => {
  // TODO: write migration here
  return knex.schema.withSchema(tenantSchema).createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()")); // Auto-generated UUID using pgcrypto
    table.string("username").notNullable().unique(); // Unique username
    table.string("password").notNullable(); // Password field
    table.timestamps(true, true); // Timestamps for created_at and updated_at

    // Create an index on username for quicker query performance
    table.index("username");
  });
};

exports.down = async (knex: Knex) => {
  // TODO: write rollback here
  return knex.schema.withSchema(tenantSchema).dropTableIfExists("users");
};

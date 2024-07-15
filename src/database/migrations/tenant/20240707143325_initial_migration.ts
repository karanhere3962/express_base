import { Knex } from "knex";
import { logger } from "../../../setup";

const tenantSchema = process.env.TENANT_SCHEMA || "public";
logger.debug("Running migration in schema:", tenantSchema);

exports.up = async (knex: Knex) => {
  // TODO: write migration here
  await knex.raw("CREATE SCHEMA IF NOT EXISTS " + tenantSchema);

  return knex.schema.withSchema(tenantSchema).createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name", 100).notNullable();
    table.string("email", 100).unique().notNullable();
    table.string("password_hash", 128).notNullable();
    table.string("display_picture", 255).nullable();
    table.string("user_type", 50).defaultTo("user").notNullable();
    table.jsonb("permissions").nullable();
    table.string("refresh_token", 256).nullable();

    table.timestamps(true, true);

    table.index("id");
    table.index("email");
    table.index("user_type");
  });
};

exports.down = async (knex: Knex) => {
  // TODO: write rollback here
  return knex.schema.withSchema(tenantSchema).dropTableIfExists("users");
};

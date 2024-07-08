import { Knex } from "knex";
import { logger } from "../../../setup";
import { user_roles, user_types } from "../../../apps/users/constants";

const tenantSchema = process.env.TENANT_SCHEMA || "public";
logger.debug("Running migration in schema:", tenantSchema);

exports.up = async (knex: Knex) => {
  // TODO: write migration here
  await knex.raw(
    "CREATE TYPE user_role AS ENUM ('admin', 'user', 'org_owner')"
  );
  return knex.schema.withSchema(tenantSchema).createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("name", 100).notNullable();
    table.string("email", 100).unique().notNullable();
    table.string("password_hash", 128).notNullable();
    table.string("display_picture", 255).nullable();
    table.enum("user_role", user_roles).nullable();
    table.enum("user_type", user_types).nullable();

    table.timestamps(true, true);

    table.index("email");
  });
};

exports.down = async (knex: Knex) => {
  // TODO: write rollback here
  return knex.schema.withSchema(tenantSchema).dropTableIfExists("users");
};

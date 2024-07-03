import type { Knex } from "knex";

// export async function up(knex: Knex): Promise<void> {
//   await knex.schema.createTable("users", (table) => {
//     table.increments("id").primary(); // Auto-incrementing integer id
//     table.string("username").notNullable().unique(); // Unique username field
//     table.string("email").notNullable().unique(); // Unique email field
//     table.string("password").notNullable(); // Password field (should be hashed)
//     table.timestamps(true, true); // Adds created_at and updated_at fields
//   });
// }

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary(); // Auto-incrementing integer id
    table.string("username").notNullable(); // Unique username field
    table.string("email").notNullable(); // Unique email field
    table.string("password").notNullable(); // Password field (should be hashed)
    table.timestamps(true, true); // Adds created_at and updated_at fields
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}

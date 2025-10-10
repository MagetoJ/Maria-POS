import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('products', (table) => {
    table.boolean('is_available').defaultTo(true);
    table.boolean('is_active').defaultTo(true);
  });
}
// ... the down function remains the same
export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('products', (table) => {
    table.dropColumn('is_available');
    table.dropColumn('is_active');
  });
}
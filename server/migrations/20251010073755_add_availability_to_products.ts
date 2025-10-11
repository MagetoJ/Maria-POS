import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasIsAvailable = await knex.schema.hasColumn('products', 'is_available');
  const hasIsActive = await knex.schema.hasColumn('products', 'is_active');

  await knex.schema.alterTable('products', (table) => {
    if (!hasIsAvailable) table.boolean('is_available').defaultTo(true);
    if (!hasIsActive) table.boolean('is_active').defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', (table) => {
    table.dropColumn('is_available');
    table.dropColumn('is_active');
  });
}

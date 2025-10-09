import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('orders', function (table) {
    table.string('delivery_address');
    table.string('delivery_status').defaultTo('unassigned'); // unassigned, assigned, out_for_delivery, delivered
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('orders', function (table) {
    table.dropColumn('delivery_address');
    table.dropColumn('delivery_status');
  });
}
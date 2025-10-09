// migrations/YYYYMMDDHHMMSS_create_orders_and_inventory.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('orders', function (table: Knex.TableBuilder) {
       table.increments('id');
       table.string('order_number', 255).notNullable().unique();
       table.string('order_type', 255).notNullable();
       table.integer('staff_id');
       table.string('status', 255).defaultTo('pending');
       table.decimal('total_amount').defaultTo(0);
    })
    .createTable('inventory_items', function (table: Knex.TableBuilder) {
       table.increments('id');
       table.string('name', 255).notNullable();
       table.string('unit', 255).notNullable();
       table.decimal('current_stock').defaultTo(0);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .dropTable('orders')
    .dropTable('inventory_items');
}
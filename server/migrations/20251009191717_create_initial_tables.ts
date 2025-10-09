// server/migrations/YYYYMMDDHHMMSS_create_initial_tables.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('staff', function (table: Knex.TableBuilder) {
       table.increments('id');
       table.string('employee_id', 255).notNullable().unique();
       table.string('username').unique();
       table.string('name', 255).notNullable();
       table.string('role', 255).notNullable();
       table.string('pin', 255).notNullable();
       table.string('password');
       table.boolean('is_active').defaultTo(true);
    })
    .createTable('products', function (table: Knex.TableBuilder) {
       table.increments('id');
       table.integer('category_id');
       table.string('name', 255).notNullable();
       table.string('description', 255);
       table.decimal('price').notNullable();
       table.boolean('is_available').defaultTo(true);
       table.integer('preparation_time').defaultTo(0);
    })
    .createTable('categories', function (table: Knex.TableBuilder) {
        table.increments('id');
        table.string('name', 255).notNullable();
        table.string('description', 255);
        table.boolean('is_active').defaultTo(true);
    })
    // --- ADD THESE NEW TABLES ---
    .createTable('tables', function (table: Knex.TableBuilder) {
        table.increments('id');
        table.string('table_number').notNullable().unique();
        table.integer('capacity').notNullable();
        table.string('status').defaultTo('available');
    })
    .createTable('rooms', function (table: Knex.TableBuilder) {
        table.increments('id');
        table.string('room_number').notNullable().unique();
        table.string('room_type').notNullable();
        table.string('status').defaultTo('vacant');
        table.string('guest_name');
        table.decimal('rate');
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .dropTable('staff')
    .dropTable('products')
    .dropTable('categories')
    .dropTable('tables') // <-- Add this
    .dropTable('rooms');  // <-- And this
}
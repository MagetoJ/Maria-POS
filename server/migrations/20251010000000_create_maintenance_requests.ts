import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('maintenance_requests', function (table: Knex.TableBuilder) {
    table.increments('id');
    table.integer('room_id').notNullable();
    table.string('room_number').notNullable();
    table.string('issue').notNullable();
    table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
    table.enum('status', ['pending', 'in_progress', 'completed']).defaultTo('pending');
    table.string('reported_by');
    table.timestamp('reported_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('maintenance_requests');
}
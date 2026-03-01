/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('room_transactions', function(table) {
    table.integer('nights').defaultTo(1);
    table.decimal('rate_at_time', 10, 2).nullable();
    table.decimal('total_price', 10, 2).nullable();
    table.string('checked_in_by').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('room_transactions', function(table) {
    table.dropColumn('nights');
    table.dropColumn('rate_at_time');
    table.dropColumn('total_price');
    table.dropColumn('checked_in_by');
  });
};

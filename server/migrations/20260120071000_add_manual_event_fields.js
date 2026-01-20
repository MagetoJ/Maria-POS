/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('invoices', table => {
    table.string('event_name').nullable();
    table.decimal('event_price', 10, 2).nullable();
    table.string('customer_name').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('invoices', table => {
    table.dropColumn('event_name');
    table.dropColumn('event_price');
    table.dropColumn('customer_name');
  });
};

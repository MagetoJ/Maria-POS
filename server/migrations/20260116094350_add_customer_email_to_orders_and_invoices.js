/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('orders', table => {
    table.string('customer_email');
  }).table('invoices', table => {
    table.string('customer_email');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('orders', table => {
    table.dropColumn('customer_email');
  }).table('invoices', table => {
    table.dropColumn('customer_email');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('invoices', table => {
    table.renameColumn('event_name', 'event_type');
    table.decimal('total_amount', 12, 2).defaultTo(0).alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('invoices', table => {
    table.renameColumn('event_type', 'event_name');
    table.decimal('total_amount', 10, 2).nullable().alter();
  });
};

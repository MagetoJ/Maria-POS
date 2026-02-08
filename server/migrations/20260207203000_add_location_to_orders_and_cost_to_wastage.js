// server/migrations/20260207203000_add_location_to_orders_and_cost_to_wastage.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add location column to orders table
  const hasLocation = await knex.schema.hasColumn('orders', 'location');
  if (!hasLocation) {
    await knex.schema.table('orders', (table) => {
      table.string('location').defaultTo('Main Location');
    });
  }

  // Add cost column to wastage_logs table
  const hasCost = await knex.schema.hasColumn('wastage_logs', 'cost');
  if (!hasCost) {
    await knex.schema.table('wastage_logs', (table) => {
      table.decimal('cost', 12, 2).defaultTo(0);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('orders', (table) => {
    table.dropColumn('location');
  });
  await knex.schema.table('wastage_logs', (table) => {
    table.dropColumn('cost');
  });
};

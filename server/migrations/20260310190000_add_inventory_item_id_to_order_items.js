/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('order_items', table => {
    table.integer('inventory_item_id').nullable().references('inventory_items.id').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('order_items', table => {
    table.dropColumn('inventory_item_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('order_items', 'inventory_item_id');
  if (!hasColumn) {
    return knex.schema.table('order_items', table => {
      table.integer('inventory_item_id').nullable().references('inventory_items.id').onDelete('SET NULL');
    });
  }
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

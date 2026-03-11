/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('inventory_items', 'image_url');
  if (!hasColumn) {
    return knex.schema.table('inventory_items', table => {
      table.text('image_url').nullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('inventory_items', table => {
    table.dropColumn('image_url');
  });
};

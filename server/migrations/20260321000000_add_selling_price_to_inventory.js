/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('inventory_items', 'selling_price');
  
  if (!hasColumn) {
    await knex.schema.table('inventory_items', function(table) {
      table.decimal('selling_price', 10, 2).defaultTo(0);
    });
    console.log('✅ Added selling_price column to inventory_items');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('inventory_items', 'selling_price');
  
  if (hasColumn) {
    await knex.schema.table('inventory_items', function(table) {
      table.dropColumn('selling_price');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasCompletedBy = await knex.schema.hasColumn('orders', 'completed_by');
  if (!hasCompletedBy) {
    await knex.schema.table('orders', function(table) {
      table.integer('completed_by').unsigned().references('id').inTable('staff').onDelete('SET NULL');
    });
    console.log('✅ Added completed_by column to orders');
  }

  const hasTransactionCode = await knex.schema.hasColumn('payments', 'transaction_code');
  if (!hasTransactionCode) {
    await knex.schema.table('payments', function(table) {
      table.text('transaction_code');
    });
    console.log('✅ Added transaction_code column to payments');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('orders', function(table) {
    table.dropColumn('completed_by');
  });
  await knex.schema.table('payments', function(table) {
    table.dropColumn('transaction_code');
  });
};

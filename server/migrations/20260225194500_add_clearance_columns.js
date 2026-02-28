/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check for columns before adding them to make the migration idempotent
  const hasOrdersCleared = await knex.schema.hasColumn('orders', 'is_cleared');
  const hasExpensesCleared = await knex.schema.hasColumn('expenses', 'is_cleared');
  const hasRoomTransCleared = await knex.schema.hasColumn('room_transactions', 'is_cleared');
  const hasStaffRequiresClearing = await knex.schema.hasColumn('staff', 'requires_clearing');

  if (!hasOrdersCleared) {
    await knex.schema.alterTable('orders', function(table) {
      table.boolean('is_cleared').defaultTo(false).index();
      table.timestamp('cleared_at').nullable();
      table.integer('cleared_by').unsigned().references('id').inTable('staff').onDelete('SET NULL');
    });
  }

  if (!hasExpensesCleared) {
    await knex.schema.alterTable('expenses', function(table) {
      table.boolean('is_cleared').defaultTo(false).index();
      table.timestamp('cleared_at').nullable();
      table.integer('cleared_by').unsigned().references('id').inTable('staff').onDelete('SET NULL');
    });
  }

  if (!hasRoomTransCleared) {
    await knex.schema.alterTable('room_transactions', function(table) {
      table.boolean('is_cleared').defaultTo(false).index();
      table.timestamp('cleared_at').nullable();
      table.integer('cleared_by').unsigned().references('id').inTable('staff').onDelete('SET NULL');
    });
  }

  if (!hasStaffRequiresClearing) {
    await knex.schema.alterTable('staff', function(table) {
      table.boolean('requires_clearing').defaultTo(true);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('orders', function(table) {
      table.dropColumn('is_cleared');
      table.dropColumn('cleared_at');
      table.dropColumn('cleared_by');
    })
    .alterTable('expenses', function(table) {
      table.dropColumn('is_cleared');
      table.dropColumn('cleared_at');
      table.dropColumn('cleared_by');
    })
    .alterTable('room_transactions', function(table) {
      table.dropColumn('is_cleared');
      table.dropColumn('cleared_at');
      table.dropColumn('cleared_by');
    })
    .alterTable('staff', function(table) {
      table.dropColumn('requires_clearing');
    });
};

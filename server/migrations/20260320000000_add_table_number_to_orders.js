/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Add table_number and special_instructions to orders table
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    ALTER TABLE orders DROP COLUMN IF EXISTS table_number;
    ALTER TABLE orders DROP COLUMN IF EXISTS special_instructions;
  `);
};

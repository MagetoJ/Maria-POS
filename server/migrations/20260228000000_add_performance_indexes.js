/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add missing indexes for performance optimization
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON user_sessions(login_time)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_attendance_log_clock_in ON attendance_log(clock_in)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_attendance_log_staff_id ON attendance_log(staff_id)');
  
  // Also add index on order_items(created_at) if it exists
  const hasOrderItemsCreatedAt = await knex.schema.hasColumn('order_items', 'created_at');
  if (hasOrderItemsCreatedAt) {
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at)');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_user_sessions_login_time');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_attendance_log_clock_in');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_attendance_log_staff_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_order_items_created_at');
};

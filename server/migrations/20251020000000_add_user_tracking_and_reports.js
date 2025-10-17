/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Add login tracking for active user monitoring
    CREATE TABLE user_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES staff(id),
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      logout_time TIMESTAMP,
      session_token TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Add password reset tokens
    CREATE TABLE password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES staff(id),
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Add inventory update permissions based on role
    ALTER TABLE inventory_items 
    ADD COLUMN allowed_roles TEXT[] DEFAULT ARRAY['admin', 'manager'];

    -- Update existing inventory items with proper role permissions
    UPDATE inventory_items 
    SET allowed_roles = ARRAY['admin', 'manager', 'kitchen_staff'] 
    WHERE inventory_type = 'kitchen';

    UPDATE inventory_items 
    SET allowed_roles = ARRAY['admin', 'manager', 'receptionist'] 
    WHERE inventory_type IN ('bar', 'housekeeping', 'minibar');

    -- Add waiter assignment to orders (this field already exists, just ensuring it's properly indexed)
    CREATE INDEX IF NOT EXISTS idx_orders_waiter ON orders(staff_id);

    -- Create sales report view for easier reporting
    CREATE OR REPLACE VIEW daily_sales_by_staff AS
    SELECT 
      s.id as staff_id,
      s.name as staff_name,
      s.role as staff_role,
      DATE(o.created_at) as sales_date,
      COUNT(o.id) as total_orders,
      SUM(o.total_amount) as total_sales,
      SUM(o.service_charge) as total_service_charge
    FROM staff s
    LEFT JOIN orders o ON s.id = o.staff_id AND o.status = 'completed'
    GROUP BY s.id, s.name, s.role, DATE(o.created_at);

    -- Create indexes for better performance
    CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
    CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
    CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
    CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
    CREATE INDEX idx_inventory_roles ON inventory_items USING gin(allowed_roles);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    DROP VIEW IF EXISTS daily_sales_by_staff;
    DROP INDEX IF EXISTS idx_inventory_roles;
    DROP INDEX IF EXISTS idx_password_reset_token;
    DROP INDEX IF EXISTS idx_password_reset_user;
    DROP INDEX IF EXISTS idx_user_sessions_active;
    DROP INDEX IF EXISTS idx_user_sessions_user;
    DROP INDEX IF EXISTS idx_orders_waiter;
    
    ALTER TABLE inventory_items DROP COLUMN IF EXISTS allowed_roles;
    
    DROP TABLE IF EXISTS password_reset_tokens;
    DROP TABLE IF EXISTS user_sessions;
  `);
};
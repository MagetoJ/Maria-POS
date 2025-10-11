/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Add username and password columns to staff table
    ALTER TABLE staff ADD COLUMN username TEXT;
    ALTER TABLE staff ADD COLUMN password TEXT;
    
    -- Update existing records with default username and password
    UPDATE staff SET 
      username = CASE 
        WHEN role = 'admin' THEN 'admin'
        ELSE LOWER(REPLACE(name, ' ', ''))
      END,
      password = CASE 
        WHEN role = 'admin' THEN 'admin123'
        ELSE 'password123'
      END;
    
    -- Make username required and unique
    ALTER TABLE staff ALTER COLUMN username SET NOT NULL;
    ALTER TABLE staff ADD CONSTRAINT staff_username_unique UNIQUE (username);
    
    -- Make password required
    ALTER TABLE staff ALTER COLUMN password SET NOT NULL;
    
    -- Create indexes for performance
    CREATE INDEX idx_staff_username ON staff(username);
    CREATE INDEX idx_staff_active ON staff(is_active);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Remove indexes
    DROP INDEX IF EXISTS idx_staff_username;
    DROP INDEX IF EXISTS idx_staff_active;
    
    -- Remove constraints
    ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_username_unique;
    
    -- Remove columns
    ALTER TABLE staff DROP COLUMN IF EXISTS username;
    ALTER TABLE staff DROP COLUMN IF EXISTS password;
  `);
};
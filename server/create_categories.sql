-- Category Creation Script
-- Generated automatically from price update report
-- Date: "2025-10-25 03:18:18.606494"

-- Note: This script creates categories that were found in the unmatched items
-- from the price update but don't exist in the current database.

BEGIN;

-- Ensure the categories table has the proper structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
        CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Create index for faster queries
        CREATE INDEX idx_categories_active ON categories (is_active);
        CREATE INDEX idx_categories_display_order ON categories (display_order);
    END IF;
END $$;


-- Create category: BEER (if it doesn't exist)
INSERT INTO categories (name, description, is_active, display_order, created_at, updated_at)
SELECT 'BEER', 'Alcoholic beer beverages', true, COALESCE((SELECT MAX(display_order) FROM categories), 0) + 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE UPPER(name) = 'BEER');

-- Create category: CANS (if it doesn't exist)  
INSERT INTO categories (name, description, is_active, display_order, created_at, updated_at)
SELECT 'CANS', 'Canned beverages and drinks', true, COALESCE((SELECT MAX(display_order) FROM categories), 0) + 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE UPPER(name) = 'CANS');

-- Create category: CIDERS (if it doesn't exist)
INSERT INTO categories (name, description, is_active, display_order, created_at, updated_at)
SELECT 'CIDERS', 'Cider and flavored alcoholic beverages', true, COALESCE((SELECT MAX(display_order) FROM categories), 0) + 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE UPPER(name) = 'CIDERS');

-- Create category: WHISKEY (if it doesn't exist)
INSERT INTO categories (name, description, is_active, display_order, created_at, updated_at)
SELECT 'WHISKEY', 'Whiskey and whisky spirits', true, COALESCE((SELECT MAX(display_order) FROM categories), 0) + 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE UPPER(name) = 'WHISKEY');

-- Update display orders to ensure proper ordering
UPDATE categories 
SET display_order = subq.new_order
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY name) as new_order
    FROM categories
) subq
WHERE categories.id = subq.id;

COMMIT;

-- Verification: List all categories
SELECT id, name, description, is_active, display_order, created_at
FROM categories 
ORDER BY display_order, name;

#!/usr/bin/env python3
"""
Script to create missing categories based on the unmatched items from the price update.
This will analyze the categories in the price report and create them in the database.
"""

import json
import re
from typing import List, Dict, Set

def extract_categories_from_report() -> Set[str]:
    """
    Extract unique categories from the price update report
    """
    categories = set()
    
    # Parse the report file to extract categories from unmatched items
    report_file = r"c:\Users\DELL\Desktop\POS Mocha\price_update_report.md"
    
    try:
        with open(report_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the unmatched items section
        unmatched_section_start = content.find("## Unmatched Price Items")
        if unmatched_section_start == -1:
            print("❌ Could not find unmatched items section in report")
            return categories
        
        # Extract table data using regex
        table_pattern = r'\| ([^|]+) \| ([^|]+) \| ([^|]+) \|'
        matches = re.findall(table_pattern, content[unmatched_section_start:])
        
        for match in matches:
            name, category, price = [item.strip() for item in match]
            # Skip header row
            if name == 'Name' or category == 'Category':
                continue
            if category and category != '---':
                categories.add(category.upper().strip())
        
        print(f"📊 Found {len(categories)} unique categories in unmatched items")
        return categories
    
    except Exception as e:
        print(f"❌ Error reading report file: {e}")
        return categories

def generate_category_insert_sql(categories: Set[str]) -> str:
    """
    Generate SQL statements to create categories
    """
    if not categories:
        return ""
    
    # Category descriptions based on common patterns
    category_descriptions = {
        'BEER': 'Alcoholic beer beverages',
        'CIDERS': 'Cider and flavored alcoholic beverages', 
        'CANS': 'Canned beverages and drinks',
        'WHISKEY': 'Whiskey and whisky spirits',
        'BRANDY': 'Brandy spirits and cognac',
        'GIN': 'Gin spirits and juniper-based drinks',
        'VODKA': 'Vodka spirits and neutral grain spirits',
        'RUM': 'Rum spirits and sugar-based spirits',
        'WINE': 'Wine and grape-based alcoholic beverages',
        'SPIRITS': 'Mixed spirits and liqueurs',
        'COCKTAILS': 'Pre-mixed cocktails and specialty drinks',
        'SOFT_DRINKS': 'Non-alcoholic soft drinks',
        'JUICES': 'Fruit juices and natural beverages',
        'WATER': 'Water and hydration beverages',
        'HOT_DRINKS': 'Coffee, tea, and hot beverages',
        'SNACKS': 'Light snacks and appetizers',
        'APPETIZERS': 'Starter dishes and small plates',
        'MAIN_COURSE': 'Main dishes and entrees',
        'DESSERTS': 'Sweet desserts and treats',
        'BREAKFAST': 'Breakfast items and morning dishes',
        'SIDES': 'Side dishes and accompaniments',
        'SOUPS': 'Soups and liquid dishes',
        'SALADS': 'Fresh salads and vegetable dishes'
    }
    
    sql_statements = []
    display_order = 1
    
    # Sort categories for consistent ordering
    sorted_categories = sorted(categories)
    
    for category in sorted_categories:
        # Generate a clean category name (replace spaces and special chars)
        clean_name = category.replace(' ', '_').replace('-', '_').upper()
        description = category_descriptions.get(clean_name, f'{category.title()} category items')
        
        sql_statements.append(f"""
-- Create category: {category}
INSERT INTO categories (name, description, is_active, display_order, created_at, updated_at)
VALUES ('{category}', '{description}', true, {display_order}, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;""")
        
        display_order += 1
    
    return '\n'.join(sql_statements)

def create_category_creation_script():
    """
    Main function to create the category creation script
    """
    print("🏗️ Starting category creation script...")
    
    # Extract categories from the report
    categories = extract_categories_from_report()
    
    if not categories:
        print("❌ No categories found to create")
        return
    
    print(f"📋 Categories to create: {', '.join(sorted(categories))}")
    
    # Generate SQL
    sql_content = f"""-- Category Creation Script
-- Generated automatically from price update report
-- Date: {json.dumps(str(__import__('datetime').datetime.now()))}

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

{generate_category_insert_sql(categories)}

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
"""
    
    # Write SQL file
    sql_file_path = r"c:\Users\DELL\Desktop\POS Mocha\server\create_categories.sql"
    try:
        with open(sql_file_path, 'w', encoding='utf-8') as f:
            f.write(sql_content)
        print(f"✅ Category creation SQL generated: {sql_file_path}")
    except Exception as e:
        print(f"❌ Error writing SQL file: {e}")
        return
    
    # Create a summary report
    summary_report = f"""# Category Creation Summary

## Overview
- **Total categories to create**: {len(categories)}
- **Source**: Unmatched items from price update report
- **SQL file**: `server/create_categories.sql`

## Categories to Create

| Category Name | Description | Display Order |
|---------------|-------------|---------------|
"""
    
    category_descriptions = {
        'BEER': 'Alcoholic beer beverages',
        'CIDERS': 'Cider and flavored alcoholic beverages', 
        'CANS': 'Canned beverages and drinks',
        'WHISKEY': 'Whiskey and whisky spirits',
        'BRANDY': 'Brandy spirits and cognac',
        'GIN': 'Gin spirits and juniper-based drinks',
        'VODKA': 'Vodka spirits and neutral grain spirits',
        'RUM': 'Rum spirits and sugar-based spirits',
        'WINE': 'Wine and grape-based alcoholic beverages',
        'SPIRITS': 'Mixed spirits and liqueurs',
        'COCKTAILS': 'Pre-mixed cocktails and specialty drinks',
        'SOFT_DRINKS': 'Non-alcoholic soft drinks',
        'JUICES': 'Fruit juices and natural beverages',
        'WATER': 'Water and hydration beverages',
        'HOT_DRINKS': 'Coffee, tea, and hot beverages',
        'SNACKS': 'Light snacks and appetizers',
        'APPETIZERS': 'Starter dishes and small plates',
        'MAIN_COURSE': 'Main dishes and entrees',
        'DESSERTS': 'Sweet desserts and treats',
        'BREAKFAST': 'Breakfast items and morning dishes',
        'SIDES': 'Side dishes and accompaniments',
        'SOUPS': 'Soups and liquid dishes',
        'SALADS': 'Fresh salads and vegetable dishes'
    }
    
    for i, category in enumerate(sorted(categories), 1):
        clean_name = category.replace(' ', '_').replace('-', '_').upper()
        description = category_descriptions.get(clean_name, f'{category.title()} category items')
        summary_report += f"| {category} | {description} | {i} |\n"
    
    summary_report += f"""

## Next Steps

1. **Review the SQL file**: Check `server/create_categories.sql` for the generated SQL statements
2. **Test on backup**: Run the SQL on a backup database first
3. **Execute on production**: Apply the categories to the main database
4. **Update products**: Consider updating product category assignments for unmatched items
5. **Add missing products**: Create products for the unmatched items using the new categories

## Execution Commands

```bash
# Run the SQL script using the Node.js runner
node server/run_category_creation.js

# Or execute directly with psql (if available)
psql -d pos_mocha_dev -f server/create_categories.sql
```

## Notes

- Categories are created with `ON CONFLICT (name) DO NOTHING` to avoid duplicates
- All new categories are set as active by default
- Display order is automatically assigned based on alphabetical order
- Existing categories will not be affected
"""
    
    # Write summary report
    report_file_path = r"c:\Users\DELL\Desktop\POS Mocha\category_creation_summary.md"
    try:
        with open(report_file_path, 'w', encoding='utf-8') as f:
            f.write(summary_report)
        print(f"✅ Category creation summary: {report_file_path}")
    except Exception as e:
        print(f"❌ Error writing summary report: {e}")

if __name__ == "__main__":
    create_category_creation_script()
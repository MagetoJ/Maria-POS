#!/usr/bin/env python3
"""
Script to create missing products from the unmatched items in the price update report.
This will analyze the unmatched items and create proper product entries with category assignments.
"""

import json
import re
from typing import List, Dict, Set

def extract_unmatched_products_from_report() -> List[Dict]:
    """
    Extract unmatched products from the price update report
    """
    products = []
    
    # Parse the report file to extract unmatched products
    report_file = r"c:\Users\DELL\Desktop\POS Mocha\price_update_report.md"
    
    try:
        with open(report_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the unmatched items section
        unmatched_section_start = content.find("## Unmatched Price Items")
        if unmatched_section_start == -1:
            print("❌ Could not find unmatched items section in report")
            return products
        
        # Extract table data using regex
        table_pattern = r'\| ([^|]+) \| ([^|]+) \| ([^|]+) \|'
        matches = re.findall(table_pattern, content[unmatched_section_start:])
        
        for match in matches:
            name, category, price = [item.strip() for item in match]
            # Skip header row and separator row
            if name in ['Name', '---'] or category in ['Category', '---']:
                continue
            
            if name and category and price:
                try:
                    price_value = float(price)
                    products.append({
                        'name': name.title(),  # Title case for better formatting
                        'category': category.upper(),
                        'price': price_value
                    })
                except ValueError:
                    print(f"⚠️ Skipping product {name} - invalid price: {price}")
                    continue
        
        print(f"📊 Found {len(products)} unmatched products to create")
        return products
    
    except Exception as e:
        print(f"❌ Error reading report file: {e}")
        return products

def map_categories_to_db_ids() -> Dict[str, int]:
    """
    Map category names to database IDs based on the existing categories
    """
    # Based on the output from the previous script, map categories to their IDs
    category_mapping = {
        'BEER': 1,
        'CIDERS': 2, 
        'WHISKEY': 3,
        'GIN': 4,
        'VODKA': 5,
        'RUM': 6,
        'BRANDY': 7,
        'TEQUILA': 8,
        'WINES': 9,
        'LIQUEURS': 10,
        'SOFT_DRINKS': 11,
        'JUICES': 12,
        'ENERGY_DRINKS': 13,
        'MAIN_DISHES': 14,
        'GRILLED_MEATS': 15,
        'FISH': 16,
        'CHICKEN': 17,
        'PORK': 18,
        'VEGETARIAN': 19,
        'SNACKS': 20,
        'BREAKFAST': 21,
        'SOUPS': 22,
        'BURGERS': 23,
        'SERVICES': 24,
        'CANS': 25
    }
    
    # Add some common alternatives and mappings
    additional_mappings = {
        'CAN': 25,  # Map CAN to CANS
        'CIDER': 2,  # Map CIDER to CIDERS 
        'WINE': 9,   # Map WINE to WINES
        'SPIRITS': 10,  # Map SPIRITS to LIQUEURS for now
        'SOFT DRINKS': 11,
        'ENERGY DRINKS': 13
    }
    
    category_mapping.update(additional_mappings)
    return category_mapping

def generate_product_insert_sql(products: List[Dict]) -> str:
    """
    Generate SQL statements to create products with proper category assignments
    """
    if not products:
        return ""
    
    category_mapping = map_categories_to_db_ids()
    sql_statements = []
    
    # Group products by category for better organization
    products_by_category = {}
    unmapped_categories = set()
    
    for product in products:
        category = product['category']
        if category in category_mapping:
            if category not in products_by_category:
                products_by_category[category] = []
            products_by_category[category].append(product)
        else:
            unmapped_categories.add(category)
            # Default to SNACKS category for unmapped items
            if 'UNMAPPED' not in products_by_category:
                products_by_category['UNMAPPED'] = []
            products_by_category['UNMAPPED'].append(product)
    
    if unmapped_categories:
        print(f"⚠️ Unmapped categories: {', '.join(unmapped_categories)}")
        print("   These will be assigned to SNACKS category (ID: 20)")
    
    # Generate SQL for each category
    for category, category_products in products_by_category.items():
        if category == 'UNMAPPED':
            category_id = 20  # SNACKS
            sql_statements.append(f"\n-- Products with unmapped categories (assigned to SNACKS)")
        else:
            category_id = category_mapping[category]
            sql_statements.append(f"\n-- {category} products (Category ID: {category_id})")
        
        for product in category_products:
            # Clean up product name and create description
            clean_name = product['name'].replace("'", "''")  # Escape single quotes
            description = f"{clean_name} from {category.title()} category"
            
            # Calculate a reasonable cost (60% of selling price as example)
            estimated_cost = round(product['price'] * 0.6, 2)
            
            sql_statements.append(f"""
INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    '{clean_name}', 
    {category_id}, 
    {product['price']}, 
    {estimated_cost},
    '{description}',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('{clean_name}') 
    AND category_id = {category_id}
);""")
    
    return '\n'.join(sql_statements)

def create_product_creation_script():
    """
    Main function to create the product creation script
    """
    print("🏭 Starting product creation script...")
    
    # Extract unmatched products from the report
    products = extract_unmatched_products_from_report()
    
    if not products:
        print("❌ No unmatched products found to create")
        return
    
    # Group by category for summary
    category_counts = {}
    for product in products:
        category = product['category']
        category_counts[category] = category_counts.get(category, 0) + 1
    
    print(f"📋 Products to create by category:")
    for category, count in sorted(category_counts.items()):
        print(f"   {category}: {count} products")
    
    # Generate SQL
    sql_content = f"""-- Product Creation Script
-- Generated automatically from price update report unmatched items
-- Date: {json.dumps(str(__import__('datetime').datetime.now()))}

-- Note: This script creates products that were unmatched in the price update
-- All products are created with estimated costs (60% of selling price)
-- Products are assigned to appropriate categories based on their category field

BEGIN;

{generate_product_insert_sql(products)}

COMMIT;

-- Verification: Count products by category
SELECT 
    c.name as category_name,
    COUNT(p.id) as product_count,
    MIN(p.price) as min_price,
    MAX(p.price) as max_price,
    AVG(p.price) as avg_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
GROUP BY c.id, c.name
ORDER BY c.display_order;
"""
    
    # Write SQL file
    sql_file_path = r"c:\Users\DELL\Desktop\POS Mocha\server\create_products.sql"
    try:
        with open(sql_file_path, 'w', encoding='utf-8') as f:
            f.write(sql_content)
        print(f"✅ Product creation SQL generated: {sql_file_path}")
    except Exception as e:
        print(f"❌ Error writing SQL file: {e}")
        return
    
    # Create a summary report
    summary_report = f"""# Product Creation Summary

## Overview
- **Total products to create**: {len(products)}
- **Categories involved**: {len(category_counts)}
- **Source**: Unmatched items from price update report
- **SQL file**: `server/create_products.sql`

## Products by Category

"""
    
    for category, count in sorted(category_counts.items()):
        category_products = [p for p in products if p['category'] == category]
        min_price = min(p['price'] for p in category_products)
        max_price = max(p['price'] for p in category_products)
        avg_price = sum(p['price'] for p in category_products) / len(category_products)
        
        summary_report += f"""### {category} ({count} products)
- **Price range**: KES {min_price:.0f} - KES {max_price:.0f}
- **Average price**: KES {avg_price:.0f}
- **Products**: {', '.join([p['name'] for p in category_products[:5]])}{'...' if len(category_products) > 5 else ''}

"""
    
    summary_report += f"""## Product Examples

| Name | Category | Price (KES) | Estimated Cost (KES) |
|------|----------|-------------|---------------------|
"""
    
    # Show first 10 products as examples
    for product in products[:10]:
        estimated_cost = round(product['price'] * 0.6, 2)
        summary_report += f"| {product['name']} | {product['category']} | {product['price']:.0f} | {estimated_cost:.0f} |\n"
    
    if len(products) > 10:
        summary_report += f"\n... and {len(products) - 10} more products\n"
    
    summary_report += f"""

## Important Notes

1. **Cost Estimation**: Product costs are estimated at 60% of selling price
2. **Category Assignment**: Products are mapped to existing database categories
3. **Duplicate Prevention**: Script checks for existing products with same name and category
4. **Default Settings**: All products are created as active and available
5. **Preparation Time**: Default 5 minutes assigned to all products

## Next Steps

1. **Review the SQL file**: Check `server/create_products.sql` for generated statements
2. **Test on backup**: Run the SQL on a backup database first
3. **Execute on production**: Apply the products to the main database
4. **Update images**: Consider adding product images after creation
5. **Review pricing**: Fine-tune prices and costs based on business needs

## Execution Commands

```bash
# Run the SQL script using the Node.js runner
node server/run_product_creation.js

# Or execute directly with psql (if available)
psql -d pos_mocha_dev -f server/create_products.sql
```
"""
    
    # Write summary report
    report_file_path = r"c:\Users\DELL\Desktop\POS Mocha\product_creation_summary.md"
    try:
        with open(report_file_path, 'w', encoding='utf-8') as f:
            f.write(summary_report)
        print(f"✅ Product creation summary: {report_file_path}")
    except Exception as e:
        print(f"❌ Error writing summary report: {e}")

if __name__ == "__main__":
    create_product_creation_script()
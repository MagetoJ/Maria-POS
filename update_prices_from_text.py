import os
import json
import re
from typing import Dict, List, Tuple

def parse_price_data(file_path: str) -> List[Dict]:
    """Parse the price data from the text file"""
    products = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Skip header line
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
            
        # Split by tabs
        parts = line.split('\t')
        if len(parts) >= 4:  # We need at least NAME, CATEGORY, ALERT_QUANTITY, SELLING_PRICE
            name = parts[0].strip()
            category = parts[1].strip()
            alert_quantity = parts[2].strip() if len(parts) > 2 else ""
            selling_price = parts[3].strip() if len(parts) > 3 else ""
            
            # Skip if no selling price or selling price is 0
            if not selling_price or selling_price == '0' or selling_price == '':
                continue
                
            try:
                price = float(selling_price)
                if price > 0:  # Only include products with valid prices
                    products.append({
                        'name': name,
                        'category': category,
                        'price': price,
                        'alert_quantity': alert_quantity
                    })
            except ValueError:
                # Skip lines with invalid price data
                continue
    
    return products

def normalize_name(name: str) -> str:
    """Normalize product name for matching"""
    # Convert to lowercase and remove extra spaces
    normalized = re.sub(r'\s+', ' ', name.lower().strip())
    
    # Common normalizations for better matching
    replacements = {
        'tusker lager': 'tusker lager',
        'whitecap': 'white cap',
        'pilsner lager': 'pilsner',
        'j w black': 'johnnie walker black label',
        'jwred': 'johnnie walker red label',
        'jw black': 'johnnie walker black label',
        'jw red': 'johnnie walker red label',
        'jw gold reserve': 'johnnie walker gold reserve',
        'jw green': 'johnnie walker green label',
        'jw platinum': 'johnnie walker platinum',
        'jw blue label': 'johnnie walker blue label',
        'jw double black': 'johnnie walker double black',
        'bond 7': 'bond 7',
        'gilbeys': 'gilbeys gin',
        'gordons': 'gordons gin',
        'smirnoff': 'smirnoff vodka',
        'captn morgan': 'captain morgan',
        'jose cuervo gold': 'jose cuervo gold',
        'camino gold': 'camino real gold',
        'camino silver': 'camino real silver',
        'viceroy': 'viceroy brandy',
        'richot': 'richot brandy',
        'cellar cask red': 'drostdy hof red',
        'cellar cask white': 'drostdy hof white',
        '4th street red': 'fourth street red',
        '4th street white': 'fourth street white',
        'drostyhof': 'drostdy hof',
        'drostoff': 'drostdy hof',
        'baieys': 'baileys',
        'baleys': 'baileys',
        'jagermeister': 'jägermeister'
    }
    
    for old, new in replacements.items():
        if old in normalized:
            normalized = normalized.replace(old, new)
    
    return normalized

def find_matching_products(price_data: List[Dict], existing_products: List[Dict]) -> List[Tuple[Dict, Dict, str]]:
    """Find matching products between price data and existing products"""
    matches = []
    unmatched_price_items = []
    
    for price_item in price_data:
        normalized_price_name = normalize_name(price_item['name'])
        best_match = None
        best_score = 0
        match_type = 'no_match'
        
        for existing_product in existing_products:
            normalized_existing_name = normalize_name(existing_product['name'])
            
            # Exact match
            if normalized_price_name == normalized_existing_name:
                best_match = existing_product
                best_score = 1.0
                match_type = 'exact'
                break
            
            # Contains match (either direction)
            elif normalized_price_name in normalized_existing_name or normalized_existing_name in normalized_price_name:
                score = min(len(normalized_price_name), len(normalized_existing_name)) / max(len(normalized_price_name), len(normalized_existing_name))
                if score > best_score:
                    best_match = existing_product
                    best_score = score
                    match_type = 'contains'
            
            # Word-based similarity
            else:
                price_words = set(normalized_price_name.split())
                existing_words = set(normalized_existing_name.split())
                common_words = price_words.intersection(existing_words)
                if common_words:
                    score = len(common_words) / max(len(price_words), len(existing_words))
                    if score > 0.5 and score > best_score:  # At least 50% word overlap
                        best_match = existing_product
                        best_score = score
                        match_type = 'words'
        
        if best_match and best_score > 0.4:  # Minimum confidence threshold
            matches.append((price_item, best_match, match_type))
        else:
            unmatched_price_items.append(price_item)
    
    return matches, unmatched_price_items

def generate_price_update_sql(matches: List[Tuple[Dict, Dict, str]]) -> str:
    """Generate SQL script to update product prices"""
    
    sql_script = """-- Price Update Script
-- Generated from price list text file
-- Updates product prices based on current market rates

BEGIN;

-- Record original prices for reference
CREATE TEMP TABLE original_prices AS 
SELECT id, name, price as old_price 
FROM products 
WHERE name IN ({product_names});

""".format(product_names=','.join([f"'{match[1]['name'].replace(chr(39), chr(39) + chr(39))}'" for match in matches]))
    
    # Add individual update statements
    for price_item, existing_product, match_type in matches:
        old_price = existing_product['price']
        new_price = price_item['price']
        price_change = ((new_price - old_price) / old_price * 100) if old_price > 0 else 0
        product_name_escaped = existing_product['name'].replace("'", "''")
        
        sql_script += f"""-- Update: {existing_product['name']} (Match type: {match_type})
-- Price: KES {old_price} → KES {new_price} ({price_change:+.1f}%)
UPDATE products 
SET price = {new_price}, 
    updated_at = NOW() 
WHERE name = '{product_name_escaped}';

"""
    
    sql_script += """-- Show updated prices
SELECT 
    p.id,
    p.name,
    op.old_price,
    p.price as new_price,
    ROUND(((p.price - op.old_price) / op.old_price * 100)::numeric, 1) as price_change_percent
FROM products p
JOIN original_prices op ON p.id = op.id
ORDER BY price_change_percent DESC;

COMMIT;

-- Final verification
SELECT COUNT(*) as updated_products FROM products WHERE updated_at > NOW() - INTERVAL '1 minute';
"""
    
    return sql_script

def create_price_update_report(matches: List[Tuple[Dict, Dict, str]], unmatched: List[Dict]) -> str:
    """Create a detailed report of the price update process"""
    
    report = f"""# Price Update Report
Generated: {os.path.basename(__file__)}

## Summary
- **Products matched**: {len(matches)}
- **Products not matched**: {len(unmatched)}
- **Total price items processed**: {len(matches) + len(unmatched)}

## Matched Products and Price Changes

| Product Name | Old Price (KES) | New Price (KES) | Change (%) | Match Type |
|--------------|----------------|----------------|-----------|------------|
"""
    
    # Sort matches by percentage change
    sorted_matches = sorted(matches, key=lambda x: ((x[0]['price'] - x[1]['price']) / x[1]['price'] * 100) if x[1]['price'] > 0 else 0, reverse=True)
    
    for price_item, existing_product, match_type in sorted_matches:
        old_price = existing_product['price']
        new_price = price_item['price']
        change_percent = ((new_price - old_price) / old_price * 100) if old_price > 0 else 0
        
        report += f"| {existing_product['name'][:40]} | {old_price:.0f} | {new_price:.0f} | {change_percent:+.1f}% | {match_type} |\n"
    
    if unmatched:
        report += f"""
## Unmatched Price Items ({len(unmatched)} items)

These items from the price list could not be matched with existing products in the database:

| Name | Category | Price (KES) |
|------|----------|------------|
"""
        for item in unmatched[:20]:  # Show first 20 unmatched items
            report += f"| {item['name'][:40]} | {item['category'][:15]} | {item['price']:.0f} |\n"
        
        if len(unmatched) > 20:
            report += f"\n... and {len(unmatched) - 20} more items\n"
    
    report += """
## Recommendations

1. **Review unmatched items**: Consider adding missing products to the database
2. **Verify price changes**: Large price changes should be reviewed before applying
3. **Update cost prices**: Consider updating cost prices proportionally to maintain margins
4. **Test before production**: Run this update on a test database first

## Next Steps

1. Review the generated SQL script: `price_update.sql`
2. Test on a backup database
3. Apply to production database
4. Update any cached price data in the application
"""
    
    return report

def main():
    """Main function to process price updates"""
    print("🔄 Starting price update process...")
    
    # File paths
    price_data_file = r"c:\Users\DELL\AppData\Local\Temp\zencoder\pasted\text\20251025000625-w3ivjv.txt"
    existing_menu_file = r"c:\Users\DELL\Desktop\POS Mocha\menu_update_data.json"
    
    try:
        # 1. Parse price data from text file
        print("📄 Parsing price data from text file...")
        price_data = parse_price_data(price_data_file)
        print(f"   Found {len(price_data)} products with valid prices")
        
        # 2. Load existing product data
        print("📚 Loading existing product data...")
        with open(existing_menu_file, 'r', encoding='utf-8') as f:
            menu_data = json.load(f)
        existing_products = menu_data['products']
        print(f"   Found {len(existing_products)} existing products in database")
        
        # 3. Find matching products
        print("🔍 Finding matching products...")
        matches, unmatched = find_matching_products(price_data, existing_products)
        print(f"   Matched: {len(matches)} products")
        print(f"   Unmatched: {len(unmatched)} products")
        
        # 4. Generate SQL update script
        print("💾 Generating SQL update script...")
        sql_script = generate_price_update_sql(matches)
        
        sql_file_path = r"c:\Users\DELL\Desktop\POS Mocha\server\price_update.sql"
        with open(sql_file_path, 'w', encoding='utf-8') as f:
            f.write(sql_script)
        print(f"   SQL script saved to: {sql_file_path}")
        
        # 5. Generate update report
        print("📊 Generating update report...")
        report = create_price_update_report(matches, unmatched)
        
        report_file_path = r"c:\Users\DELL\Desktop\POS Mocha\price_update_report.md"
        with open(report_file_path, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"   Report saved to: {report_file_path}")
        
        # 6. Show summary
        print("\n✅ Price update process completed!")
        print("\n📋 Summary:")
        print(f"   - Products to update: {len(matches)}")
        print(f"   - Unmatched items: {len(unmatched)}")
        print(f"   - SQL script: server/price_update.sql")
        print(f"   - Detailed report: price_update_report.md")
        
        if matches:
            print("\n🔍 Preview of major price changes:")
            # Show top 5 biggest price changes
            sorted_matches = sorted(matches, key=lambda x: abs((x[0]['price'] - x[1]['price']) / x[1]['price'] * 100) if x[1]['price'] > 0 else 0, reverse=True)
            for i, (price_item, existing_product, match_type) in enumerate(sorted_matches[:5]):
                old_price = existing_product['price']
                new_price = price_item['price']
                change_percent = ((new_price - old_price) / old_price * 100) if old_price > 0 else 0
                print(f"   {i+1}. {existing_product['name'][:35]:<35} KES {old_price:>6.0f} → {new_price:>6.0f} ({change_percent:+6.1f}%)")
        
        print(f"\n📁 Next steps:")
        print("   1. Review the report: price_update_report.md")
        print("   2. Verify the SQL script: server/price_update.sql")
        print("   3. Run the database update: node server/run_price_update.js")
        
    except FileNotFoundError as e:
        print(f"❌ Error: Could not find file - {e}")
    except Exception as e:
        print(f"❌ Error during price update: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
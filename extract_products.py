import PyPDF2
import re

try:
    products_data = []
    
    with open('c:/Users/DELL/Downloads/products-export-2025-09-30 (2).pdf', 'rb') as file:
        pdf = PyPDF2.PdfReader(file)
        
        all_text = ''
        for page in pdf.pages:
            text = page.extract_text()
            if text.strip():
                all_text += text + '\n'
        
        # Split into lines and process
        lines = all_text.split('\n')
        
        # Skip header line and process product lines
        for line in lines[1:]:
            line = line.strip()
            if not line or line.startswith('NAME BRAND'):
                continue
                
            # Try to parse the line - it seems to be tab or space separated
            # Format appears to be: NAME BRAND UNIT CATEGORY SUB-CATEGORY SKU BARCODE TYPE MANAGE_STOCK ALERT_QUANTITY
            parts = re.split(r'\s+', line)
            
            if len(parts) >= 4:
                name = parts[0]
                brand = parts[1] if len(parts) > 1 else 'GEN'
                unit = parts[2] if len(parts) > 2 else 'Pcs'
                category = parts[3] if len(parts) > 3 else 'MISC'
                sub_category = parts[4] if len(parts) > 4 else ''
                sku = parts[5] if len(parts) > 5 and parts[5] != 'C128' else ''
                
                # Clean up name
                clean_name = name.replace('GEN', '').replace('_', ' ').strip()
                if not clean_name:
                    clean_name = name
                    
                products_data.append({
                    'name': clean_name,
                    'brand': brand,
                    'unit': unit, 
                    'category': category,
                    'sub_category': sub_category,
                    'sku': sku
                })
        
        # Show results
        print(f'Extracted {len(products_data)} products')
        print('\nFirst 20 products:')
        for i, product in enumerate(products_data[:20]):
            print(f"{i+1}. {product['name']} | {product['category']} | {product['brand']}")
            
        # Show unique categories
        categories = list(set([p['category'] for p in products_data]))
        print(f'\nFound {len(categories)} categories:')
        for cat in sorted(categories):
            count = len([p for p in products_data if p['category'] == cat])
            print(f'  - {cat}: {count} items')
        
        # Save to CSV for reference
        import csv
        with open('c:/Users/DELL/Desktop/POS Mocha/extracted_products.csv', 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['name', 'brand', 'unit', 'category', 'sub_category', 'sku']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(products_data)
        print(f'\nData saved to extracted_products.csv')
            
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
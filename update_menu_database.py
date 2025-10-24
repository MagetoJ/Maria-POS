import json
import os
import shutil

# Create images directory structure
def setup_image_directories():
    """Create directory structure for product images"""
    
    base_path = "c:/Users/DELL/Desktop/POS Mocha/public"
    images_path = os.path.join(base_path, "images")
    products_path = os.path.join(images_path, "products")
    
    # Create directories
    os.makedirs(products_path, exist_ok=True)
    
    # Create category subdirectories
    categories = [
        "beer", "ciders", "whiskey", "gin", "vodka", "rum", "brandy", 
        "tequila", "wines", "liqueurs", "soft-drinks", "juices", 
        "energy-drinks", "main-dishes", "grilled-meats", "fish", 
        "chicken", "pork", "vegetarian", "snacks", "breakfast", 
        "soups", "burgers", "services"
    ]
    
    for category in categories:
        category_path = os.path.join(products_path, category)
        os.makedirs(category_path, exist_ok=True)
        
        # Create a placeholder image for each category
        placeholder_content = f"""<!-- Placeholder for {category} products -->
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f3f4f6"/>
  <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">
    {category.replace('-', ' ').title()}
  </text>
</svg>"""
        
        placeholder_file = os.path.join(category_path, "placeholder.svg")
        with open(placeholder_file, 'w', encoding='utf-8') as f:
            f.write(placeholder_content)
    
    print(f"✅ Created image directories at {products_path}")
    return products_path

def generate_sql_script():
    """Generate SQL script to update the database"""
    
    # Load the menu data
    with open('c:/Users/DELL/Desktop/POS Mocha/menu_update_data.json', 'r', encoding='utf-8') as f:
        menu_data = json.load(f)
    
    sql_script = """-- Menu Update Script
-- Generated from products export PDF

-- Clear existing data (be careful in production!)
DELETE FROM products WHERE id > 0;
DELETE FROM categories WHERE id > 0;

-- Reset sequences
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Insert categories
"""
    
    # Add categories
    for i, category in enumerate(menu_data['categories'], 1):
        sql_script += f"""INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES ({i}, '{category['name']}', '{category['description']}', true, {category['display_order']}, NOW(), NOW());
"""
    
    sql_script += "\n-- Insert products\n"
    
    # Create category name to ID mapping
    category_map = {cat['name']: i for i, cat in enumerate(menu_data['categories'], 1)}
    
    # Add products
    for i, product in enumerate(menu_data['products'], 1):
        category_id = category_map[product['category']]
        
        # Generate image URL path
        category_slug = product['category'].lower().replace(' ', '-')
        product_slug = product['name'].lower().replace(' ', '-').replace('&', 'and').replace('/', '-')
        image_url = f"/images/products/{category_slug}/{product_slug}.jpg"
        
        sql_script += f"""INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES ({i}, {category_id}, '{product['name'].replace("'", "''")}', '{product['description'].replace("'", "''")}', {product['price']}, {product['cost']}, true, true, '{image_url}', {product['preparation_time']}, NOW(), NOW());
"""
    
    # Update sequences
    sql_script += f"""
-- Update sequences to correct values
ALTER SEQUENCE categories_id_seq RESTART WITH {len(menu_data['categories']) + 1};
ALTER SEQUENCE products_id_seq RESTART WITH {len(menu_data['products']) + 1};

-- Verify counts
SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM products;
"""
    
    # Save SQL script
    with open('c:/Users/DELL/Desktop/POS Mocha/server/update_menu.sql', 'w', encoding='utf-8') as f:
        f.write(sql_script)
    
    print(f"✅ Generated SQL script with {len(menu_data['categories'])} categories and {len(menu_data['products'])} products")
    return 'c:/Users/DELL/Desktop/POS Mocha/server/update_menu.sql'

def update_menu_grid_component():
    """Update MenuGrid component to properly display images"""
    
    menu_grid_path = "c:/Users/DELL/Desktop/POS Mocha/src/react-app/components/MenuGrid.tsx"
    
    # Read current content
    with open(menu_grid_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update the image display section
    old_image_section = """            <div className="aspect-square bg-gray-50 flex items-center justify-center">
              {/* Image would go here if available */}
              <span className="text-3xl text-gray-300">{product.name.charAt(0)}</span>
            </div>"""
    
    new_image_section = """            <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200"><span class="text-2xl font-bold text-yellow-600">${product.name.charAt(0)}</span></div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200">
                  <span className="text-2xl font-bold text-yellow-600">{product.name.charAt(0)}</span>
                </div>
              )}
            </div>"""
    
    # Replace the image section
    updated_content = content.replace(old_image_section, new_image_section)
    
    # Add preparation time display if not exists
    if "preparation_time" not in content:
        # Add preparation time display in product info
        old_info = """              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 h-12">{product.name}</h3>
              <div className="flex items-center justify-between mt-2">"""
        
        new_info = """              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 h-10">{product.name}</h3>
              {product.preparation_time && product.preparation_time > 2 && (
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {product.preparation_time} min
                </div>
              )}
              <div className="flex items-center justify-between mt-1">"""
        
        updated_content = updated_content.replace(old_info, new_info)
    
    # Write updated content
    with open(menu_grid_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print("✅ Updated MenuGrid component to display images and preparation time")

def create_readme():
    """Create README for the menu update"""
    
    readme_content = """# Menu Update - Product Images Setup

## Overview
This update adds comprehensive menu data based on the products export PDF and sets up proper image handling.

## What was updated:

### 1. Database Structure
- Added 24 product categories
- Added 89 products with proper pricing and descriptions
- Each product has an image_url field for future image uploads

### 2. Image Directory Structure
Created `/public/images/products/` with subdirectories for each category:
- beer/
- ciders/
- whiskey/
- gin/
- vodka/
- rum/
- brandy/
- tequila/
- wines/
- liqueurs/
- soft-drinks/
- juices/
- energy-drinks/
- main-dishes/
- grilled-meats/
- fish/
- chicken/
- pork/
- vegetarian/
- snacks/
- breakfast/
- soups/
- burgers/
- services/

### 3. Frontend Updates
- Updated MenuGrid component to display product images
- Added fallback for missing images
- Added preparation time display for items that take longer to prepare

### 4. How to add product images:

1. **Naming Convention**: 
   - File format: JPG or PNG
   - Name format: `product-name-lowercase-with-dashes.jpg`
   - Example: "Tusker Lager" → `tusker-lager.jpg`

2. **Directory Structure**:
   - Place images in `/public/images/products/{category}/`
   - Example: Beer images go in `/public/images/products/beer/`

3. **Image Specifications**:
   - Recommended size: 400x400px (square)
   - Format: JPG or PNG
   - File size: Under 500KB for optimal loading

### 5. Database Update Instructions:
Run the generated SQL script to update your database:
```sql
-- Run the update_menu.sql script in your PostgreSQL database
psql -d your_database_name -f server/update_menu.sql
```

## Next Steps:
1. Run the SQL update script
2. Restart your server
3. Add actual product images to the appropriate directories
4. Test the menu display in the application

## Notes:
- All products are set as available by default
- Pricing is in KES (Kenyan Shillings)
- Preparation times are estimated and can be adjusted
- Image URLs are pre-configured but actual images need to be uploaded
"""

    with open('c:/Users/DELL/Desktop/POS Mocha/MENU_UPDATE_README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("✅ Created MENU_UPDATE_README.md with instructions")

def main():
    """Main function to run all updates"""
    print("🚀 Starting menu update process...")
    
    try:
        # 1. Setup image directories
        images_path = setup_image_directories()
        
        # 2. Generate SQL script
        sql_path = generate_sql_script()
        
        # 3. Update frontend component
        update_menu_grid_component()
        
        # 4. Create documentation
        create_readme()
        
        print("\n✅ Menu update process completed successfully!")
        print("\n📋 Summary:")
        print("   - Created image directory structure")
        print("   - Generated SQL update script")
        print("   - Updated MenuGrid component for image display")
        print("   - Created documentation")
        print(f"\n📁 Next steps:")
        print("   1. Run the SQL script: server/update_menu.sql")
        print("   2. Add product images to: public/images/products/")
        print("   3. Restart the server")
        print("   4. Check MENU_UPDATE_README.md for detailed instructions")
        
    except Exception as e:
        print(f"❌ Error during menu update: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
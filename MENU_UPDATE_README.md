# Menu Update - Product Images Setup

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


import db from './src/db';

async function audit() {
  try {
    console.log('🔍 Starting Inventory Audit...');
    
    // 1. Check for products with missing inventory links
    const products = await db('products').where('is_active', true);
    const unlinkedProducts = products.filter(p => !p.inventory_item_id);
    
    console.log(`📊 Total Active Products: ${products.length}`);
    console.log(`⚠️ Unlinked Products: ${unlinkedProducts.length}`);

    for (const product of unlinkedProducts) {
      const match = await db('inventory_items')
        .whereRaw('TRIM(LOWER(name)) = ?', [product.name.trim().toLowerCase()])
        .where('is_active', true)
        .first();
      
      if (match) {
        console.log(`✅ Potential Match Found: "${product.name}" can be linked to Inventory ID ${match.id}`);
      } else {
        console.log(`❌ No Match Found: "${product.name}" has no matching inventory item by name.`);
      }
    }

    // 2. Check for inactive inventory items that are linked
    const linkedInactive = await db('products')
      .join('inventory_items', 'products.inventory_item_id', 'inventory_items.id')
      .where('inventory_items.is_active', false)
      .select('products.name as product_name', 'inventory_items.name as inventory_name');

    if (linkedInactive.length > 0) {
      console.log(`🚨 Linked to Inactive Inventory: ${linkedInactive.length} items found!`);
      linkedInactive.forEach(item => {
        console.log(`   - Product "${item.product_name}" is linked to INACTIVE inventory "${item.inventory_name}"`);
      });
    } else {
      console.log('✅ No products are linked to inactive inventory items.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

audit();

const knex = require('knex');
const path = require('path');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'database', 'pos.sqlite3')
  },
  useNullAsDefault: true
});

async function fixInventoryTable() {
  try {
    console.log('Fixing inventory table...');
    
    await db.schema.dropTableIfExists('inventory_items');
    
    await db.schema.createTable('inventory_items', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('category');
      table.integer('current_stock').defaultTo(0);
      table.integer('minimum_stock').defaultTo(0);
      table.string('unit').notNullable(); // kg, pcs, liters, etc
      table.decimal('cost_per_unit', 10, 2).defaultTo(0);
      table.string('supplier');
      table.date('last_restock_date');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    
    console.log('✅ Inventory table fixed!');
    
    // Add sample inventory items
    await db('inventory_items').insert([
      {
        name: 'Flour',
        category: 'Baking',
        current_stock: 50,
        minimum_stock: 10,
        unit: 'kg',
        cost_per_unit: 150,
        supplier: 'ABC Suppliers',
        last_restock_date: new Date().toISOString().split('T')[0]
      },
      {
        name: 'Sugar',
        category: 'Baking',
        current_stock: 30,
        minimum_stock: 15,
        unit: 'kg',
        cost_per_unit: 120,
        supplier: 'ABC Suppliers',
        last_restock_date: new Date().toISOString().split('T')[0]
      },
      {
        name: 'Coffee Beans',
        category: 'Beverages',
        current_stock: 5,
        minimum_stock: 10,
        unit: 'kg',
        cost_per_unit: 800,
        supplier: 'Coffee World',
        last_restock_date: new Date().toISOString().split('T')[0]
      }
    ]);
    
    console.log('✅ Sample inventory added!');
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await db.destroy();
    process.exit(1);
  }
}

fixInventoryTable();
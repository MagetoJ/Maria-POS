const knex = require('knex');
const path = require('path');

// Load environment variables
require('dotenv').config({ 
  path: path.join(__dirname, process.env.NODE_ENV === 'production' ? '.env.production' : '.env')
});

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔧 Fixing image columns in database...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database URL: ${DATABASE_URL.replace(/:[^:/@]*@/, ':***@')}`);

const isProduction = process.env.NODE_ENV === 'production';

const db = knex({
  client: 'pg',
  connection: {
    connectionString: DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  }
});

async function fixImageColumns() {
  try {
    console.log('\n🔍 Testing database connection...');
    await db.raw('SELECT 1+1 as result');
    console.log('✅ Database connection successful');

    const tablesToFix = [
      { name: 'products', description: 'Menu items/products' },
      { name: 'inventory_items', description: 'Inventory items' },
      { name: 'rooms', description: 'Hotel rooms' }
    ];

    console.log('\n🔄 Checking and adding image_url columns...');

    for (const table of tablesToFix) {
      try {
        // Check if table exists
        const tableExists = await db.schema.hasTable(table.name);
        if (!tableExists) {
          console.log(`⚠️ Table '${table.name}' does not exist - skipping`);
          continue;
        }

        // Check if image_url column exists
        const hasImageUrl = await db.schema.hasColumn(table.name, 'image_url');
        
        if (hasImageUrl) {
          console.log(`✅ Table '${table.name}' already has image_url column`);
        } else {
          console.log(`🔧 Adding image_url column to '${table.name}' table...`);
          await db.schema.table(table.name, (t) => {
            t.text('image_url').nullable();
          });
          console.log(`✅ Added image_url column to '${table.name}'`);
        }

        // Add index for image_url if it doesn't exist
        const indexName = `idx_${table.name}_image_url`;
        try {
          await db.raw(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${table.name}(image_url)`);
          console.log(`✅ Index '${indexName}' ensured`);
        } catch (indexError) {
          console.log(`⚠️ Index '${indexName}' may already exist`);
        }

      } catch (tableError) {
        console.error(`❌ Error processing table '${table.name}':`, tableError.message);
      }
    }

    console.log('\n🔍 Verifying column additions...');
    for (const table of tablesToFix) {
      const tableExists = await db.schema.hasTable(table.name);
      if (tableExists) {
        const hasImageUrl = await db.schema.hasColumn(table.name, 'image_url');
        console.log(`   - ${table.name}: ${hasImageUrl ? '✅' : '❌'} image_url column`);
      }
    }

    console.log('\n🔍 Database table information:');
    const tables = await db.raw(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'inventory_items', 'rooms')
      AND column_name = 'image_url'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('   Image URL columns found:');
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}.${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('   ⚠️ No image_url columns found in target tables');
    }

    console.log('\n🎉 Image column fix completed successfully!');

  } catch (error) {
    console.error('❌ Image column fix failed:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Details: ${error.detail}`);
    }
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

fixImageColumns();
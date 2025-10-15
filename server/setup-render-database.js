const knex = require('knex');
const path = require('path');

// Load environment variables
require('dotenv').config({ 
  path: path.join(__dirname, process.env.NODE_ENV === 'production' ? '.env.production' : '.env')
});

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔧 Setting up Render PostgreSQL Database...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database URL: ${DATABASE_URL.replace(/:[^:/@]*@/, ':***@')}`);

const isProduction = process.env.NODE_ENV === 'production';

const db = knex({
  client: 'pg',
  connection: {
    connectionString: DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  },
  migrations: {
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
});

async function setupDatabase() {
  try {
    console.log('\n🔍 Testing database connection...');
    await db.raw('SELECT 1+1 as result');
    console.log('✅ Database connection successful');

    console.log('\n🔄 Running database migrations...');
    const [batchNo, migrations] = await db.migrate.latest();
    
    if (migrations.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`✅ Ran ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }

    console.log('\n🔍 Verifying database schema...');
    
    // Check if all required tables exist
    const tables = ['staff', 'products', 'categories', 'inventory_items', 'orders', 'rooms'];
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      if (exists) {
        console.log(`✅ Table '${table}' exists`);
        
        // Check for image_url columns
        if (['products', 'inventory_items', 'rooms'].includes(table)) {
          const hasImageUrl = await db.schema.hasColumn(table, 'image_url');
          console.log(`   ${hasImageUrl ? '✅' : '❌'} Column 'image_url' ${hasImageUrl ? 'exists' : 'missing'}`);
        }
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }

    console.log('\n🌱 Running database seeds...');
    await db.seed.run();
    console.log('✅ Database seeds completed');

    console.log('\n🔍 Database setup verification...');
    const staffCount = await db('staff').count('id as count').first();
    const productsCount = await db('products').count('id as count').first();
    const categoriesCount = await db('categories').count('id as count').first();
    
    console.log(`   - Staff records: ${staffCount.count}`);
    console.log(`   - Product records: ${productsCount.count}`);
    console.log(`   - Category records: ${categoriesCount.count}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('✅ Ready for production deployment');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
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

setupDatabase();
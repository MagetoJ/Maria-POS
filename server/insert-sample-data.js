const knex = require('knex');
require('dotenv').config();

// PostgreSQL configuration
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false
  }
});

async function insertSampleData() {
  try {
    console.log('📊 Inserting sample data...');
    
    // Test connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Insert categories if empty
    const categoryCount = await db('categories').count('* as count');
    if (parseInt(categoryCount[0].count) === 0) {
      console.log('📝 Inserting categories...');
      await db('categories').insert([
        { name: 'Beverages', description: 'Hot and cold drinks' },
        { name: 'Main Courses', description: 'Main dishes and entrees' },
        { name: 'Appetizers', description: 'Starters and small plates' },
        { name: 'Desserts', description: 'Sweet treats and desserts' },
        { name: 'Salads', description: 'Fresh salads and healthy options' },
        { name: 'Sandwiches', description: 'Various sandwich options' },
        { name: 'Seafood', description: 'Fresh seafood dishes' },
        { name: 'Vegetarian', description: 'Vegetarian and vegan options' }
      ]);
      console.log('✅ Categories inserted successfully!');
    } else {
      console.log('📋 Categories already exist');
    }

    // Insert products if empty
    const productCount = await db('products').count('* as count');
    if (parseInt(productCount[0].count) === 0) {
      console.log('📝 Inserting products...');
      await db('products').insert([
        // Beverages (category_id: 1)
        { name: 'Coffee', description: 'Freshly brewed coffee', price: 3.50, category_id: 1, is_available: true, is_active: true, preparation_time: 5 },
        { name: 'Tea', description: 'Premium tea selection', price: 2.50, category_id: 1, is_available: true, is_active: true, preparation_time: 3 },
        { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 4.99, category_id: 1, is_available: true, is_active: true, preparation_time: 2 },
        { name: 'Soft Drinks', description: 'Coca-Cola, Pepsi, Sprite', price: 2.99, category_id: 1, is_available: true, is_active: true, preparation_time: 1 },
        
        // Main Courses (category_id: 2)
        { name: 'Grilled Chicken', description: 'Juicy grilled chicken breast', price: 18.99, category_id: 2, is_available: true, is_active: true, preparation_time: 25 },
        { name: 'Beef Steak', description: 'Premium ribeye steak', price: 28.99, category_id: 2, is_available: true, is_active: true, preparation_time: 30 },
        { name: 'Fish & Chips', description: 'Beer-battered fish with chips', price: 16.99, category_id: 2, is_available: true, is_active: true, preparation_time: 20 },
        { name: 'Pasta Carbonara', description: 'Classic Italian pasta', price: 15.99, category_id: 2, is_available: true, is_active: true, preparation_time: 15 },
        
        // Appetizers (category_id: 3)
        { name: 'Buffalo Wings', description: 'Spicy buffalo chicken wings', price: 9.99, category_id: 3, is_available: true, is_active: true, preparation_time: 12 },
        { name: 'Mozzarella Sticks', description: 'Crispy mozzarella sticks', price: 7.99, category_id: 3, is_available: true, is_active: true, preparation_time: 8 },
        { name: 'Nachos', description: 'Loaded nachos with cheese', price: 8.99, category_id: 3, is_available: true, is_active: true, preparation_time: 10 },
        
        // Desserts (category_id: 4)
        { name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 6.99, category_id: 4, is_available: true, is_active: true, preparation_time: 5 },
        { name: 'Ice Cream', description: 'Vanilla, chocolate, or strawberry', price: 4.99, category_id: 4, is_available: true, is_active: true, preparation_time: 2 },
        { name: 'Apple Pie', description: 'Homemade apple pie', price: 5.99, category_id: 4, is_available: true, is_active: true, preparation_time: 3 },
        
        // Salads (category_id: 5)
        { name: 'Caesar Salad', description: 'Classic Caesar with croutons', price: 11.99, category_id: 5, is_available: true, is_active: true, preparation_time: 8 },
        { name: 'Greek Salad', description: 'Fresh vegetables with feta', price: 10.99, category_id: 5, is_available: true, is_active: true, preparation_time: 7 },
        
        // Sandwiches (category_id: 6)
        { name: 'Club Sandwich', description: 'Triple-decker club sandwich', price: 12.99, category_id: 6, is_available: true, is_active: true, preparation_time: 12 },
        { name: 'BLT', description: 'Bacon, lettuce, and tomato', price: 9.99, category_id: 6, is_available: true, is_active: true, preparation_time: 10 },
        
        // Seafood (category_id: 7)
        { name: 'Grilled Salmon', description: 'Fresh Atlantic salmon', price: 22.99, category_id: 7, is_available: true, is_active: true, preparation_time: 20 },
        { name: 'Shrimp Scampi', description: 'Garlic butter shrimp', price: 19.99, category_id: 7, is_available: true, is_active: true, preparation_time: 18 },
        
        // Vegetarian (category_id: 8)
        { name: 'Veggie Burger', description: 'Plant-based burger patty', price: 13.99, category_id: 8, is_available: true, is_active: true, preparation_time: 15 },
        { name: 'Quinoa Bowl', description: 'Healthy quinoa and vegetables', price: 14.99, category_id: 8, is_available: true, is_active: true, preparation_time: 12 }
      ]);
      console.log('✅ Products inserted successfully!');
    } else {
      console.log('📋 Products already exist');
    }

    // Insert tables if empty
    const tableCount = await db('tables').count('* as count');
    if (parseInt(tableCount[0].count) === 0) {
      console.log('📝 Inserting tables...');
      await db('tables').insert([
        { table_number: 'T01', capacity: 2, status: 'available' },
        { table_number: 'T02', capacity: 4, status: 'available' },
        { table_number: 'T03', capacity: 6, status: 'available' },
        { table_number: 'T04', capacity: 2, status: 'available' },
        { table_number: 'T05', capacity: 4, status: 'available' },
        { table_number: 'T06', capacity: 8, status: 'available' },
        { table_number: 'T07', capacity: 4, status: 'available' },
        { table_number: 'T08', capacity: 2, status: 'available' }
      ]);
      console.log('✅ Tables inserted successfully!');
    } else {
      console.log('📋 Tables already exist');
    }

    // Insert rooms if empty
    const roomCount = await db('rooms').count('* as count');
    if (parseInt(roomCount[0].count) === 0) {
      console.log('📝 Inserting rooms...');
      await db('rooms').insert([
        { room_number: '101', room_type: 'Standard', rate: 99.99, status: 'available', guest_name: null },
        { room_number: '102', room_type: 'Standard', rate: 99.99, status: 'available', guest_name: null },
        { room_number: '103', room_type: 'Standard', rate: 99.99, status: 'available', guest_name: null },
        { room_number: '201', room_type: 'Deluxe', rate: 149.99, status: 'available', guest_name: null },
        { room_number: '202', room_type: 'Deluxe', rate: 149.99, status: 'available', guest_name: null },
        { room_number: '203', room_type: 'Deluxe', rate: 149.99, status: 'available', guest_name: null },
        { room_number: '301', room_type: 'Suite', rate: 249.99, status: 'available', guest_name: null },
        { room_number: '302', room_type: 'Suite', rate: 299.99, status: 'available', guest_name: null },
        { room_number: '401', room_type: 'Penthouse', rate: 499.99, status: 'available', guest_name: null },
        { room_number: '402', room_type: 'Penthouse', rate: 599.99, status: 'available', guest_name: null }
      ]);
      console.log('✅ Rooms inserted successfully!');
    } else {
      console.log('📋 Rooms already exist');
    }

    console.log('\n🎉 Sample data insertion complete!');
    
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Data insertion failed:', error.message);
    console.error('\nFull error:', error);
    await db.destroy();
    process.exit(1);
  }
}

insertSampleData();
import db from './server/dist/db.js';

async function testMaintenanceRequests() {
  try {
    console.log('🔍 Testing maintenance_requests table...');
    
    // Test if we can query the table
    const requests = await db('maintenance_requests').select('*').whereNot('status', 'completed').orderBy('reported_at', 'desc');
    console.log('✅ Query successful, found requests:', requests.length);
    console.log('Sample data:', requests.slice(0, 3));
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit();
  }
}

testMaintenanceRequests();
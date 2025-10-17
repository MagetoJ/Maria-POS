const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);

async function debugUsers() {
  try {
    console.log('🔍 Checking all users in database...');
    
    const users = await knex('staff').select('*');
    console.log('All users found:', users.length);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Password hash length: ${user.password ? user.password.length : 'null'}`);
      console.log(`  Created: ${user.created_at}`);
      console.log(`  Active: ${user.is_active}`);
    });

    // Try to find admin specifically
    const adminUser = await knex('staff').where('username', 'admin').first();
    if (adminUser) {
      console.log('\n🎯 Admin user found:');
      console.log(`  Username: ${adminUser.username}`);
      console.log(`  Password starts with: ${adminUser.password ? adminUser.password.substring(0, 10) + '...' : 'null'}`);
      console.log(`  Role: ${adminUser.role}`);
      console.log(`  Active: ${adminUser.is_active}`);
    } else {
      console.log('\n❌ No admin user found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await knex.destroy();
  }
}

debugUsers();
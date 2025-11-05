const knex = require('knex');
const knexfileExport = require('./dist/knexfile');
const config = knexfileExport.default.development;
config.connection.ssl = false;
const db = knex(config);

async function insertKizito() {
  try {
    // Check if Kizito already exists
    const existingKizito = await db('staff').where({ username: 'Kizito' }).first();
    if (existingKizito) {
      console.log('Kizito already exists with id:', existingKizito.id);
      process.exit(0);
    }

    // Insert Kizito as admin user
    const result = await db('staff').insert({
      employee_id: 'EMP-KIZITO',
      name: 'Kizito Admin',
      role: 'admin',
      pin: '0000',
      username: 'Kizito',
      password: 'password123',  // Plain text for now
      is_active: true
    });

    console.log('✅ Kizito user created successfully');
    console.log('Username: Kizito');
    console.log('Password: password123');
    console.log('Role: admin');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

insertKizito();
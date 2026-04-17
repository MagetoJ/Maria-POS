// server/replace_admins.js
const bcrypt = require('bcrypt');
const knex = require('knex');
const path = require('path');
const dotenv = require('dotenv');

// 1. Load configuration
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, envFile) });

// 2. Setup Database Connection
const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  }
});

async function replaceAdmins() {
  const NEW_USER = {
    username: 'Kizito-MH',
    password_plain: 'KizitoMH2026', // This will be hashed
    name: 'Kizito MH',              // Display name
    role: 'admin',
    employee_id: 'EMP-KIZITO',      // Unique ID
    pin: '2026',                    // Login PIN
    email: 'kizito@example.com',    // Placeholder email
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    console.log('🔒 Hashing password for Kizito-MH...');
    const hash = await bcrypt.hash(NEW_USER.password_plain, 10);

    // 1. Check if username already exists
    const existing = await db('staff').where({ username: NEW_USER.username }).first();
    
    if (existing) {
      console.log(`📝 Updating existing user "${NEW_USER.username}"...`);
      await db('staff').where({ id: existing.id }).update({
        password: hash,
        name: NEW_USER.name,
        role: NEW_USER.role,
        employee_id: NEW_USER.employee_id,
        pin: NEW_USER.pin,
        is_active: true,
        updated_at: new Date()
      });
    } else {
      console.log(`📝 Adding new user "${NEW_USER.username}" to database...`);
      await db('staff').insert({
        username: NEW_USER.username,
        password: hash,
        name: NEW_USER.name,
        role: NEW_USER.role,
        employee_id: NEW_USER.employee_id,
        pin: NEW_USER.pin,
        email: NEW_USER.email,
        is_active: NEW_USER.is_active,
        created_at: NEW_USER.created_at,
        updated_at: NEW_USER.updated_at
      });
    }

    // 2. Remove all other admins
    console.log('🧹 Removing all other admins...');
    const deletedCount = await db('staff')
      .where({ role: 'admin' })
      .andWhereNot({ username: NEW_USER.username })
      .delete();

    console.log(`✅ Success! Kizito-MH is now the only admin.`);
    console.log(`🗑️ Removed ${deletedCount} other admin(s).`);

  } catch (error) {
    console.error('❌ Error replacing admins:', error);
  } finally {
    await db.destroy();
  }
}

replaceAdmins();

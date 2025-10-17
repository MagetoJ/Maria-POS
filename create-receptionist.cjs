const bcrypt = require('bcrypt');
const db = require('./server/dist/db.js').default;

async function createReceptionist() {
  try {
    const hashedPassword = await bcrypt.hash('lokeshen', 10);
    
    // Check if receptionist already exists
    const existingUser = await db('staff').where({ username: 'receptionist' }).first();
    
    if (existingUser) {
      // Update existing user
      await db('staff')
        .where({ username: 'receptionist' })
        .update({
          password: hashedPassword,
          is_active: true
        });
      console.log('Receptionist user updated successfully');
    } else {
      // Create new user
      await db('staff').insert({
        employee_id: 'EMP_REC001',
        name: 'Jane Receptionist',
        role: 'receptionist',
        pin: '7777',
        username: 'receptionist',
        password: hashedPassword,
        is_active: true
      });
      console.log('Receptionist user created successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createReceptionist();
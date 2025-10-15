const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './database/pos.sqlite3'
  },
  useNullAsDefault: true
});

async function updateEmails() {
  try {
    await knex.raw(`UPDATE staff SET email = LOWER(name) || '@mariahavens.com' WHERE email IS NULL`);
    console.log('Email addresses updated successfully');
  } catch (error) {
    console.error('Error updating emails:', error.message);
  } finally {
    await knex.destroy();
  }
}

updateEmails();
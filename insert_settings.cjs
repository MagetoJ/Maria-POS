const db = require('./server/dist/db').default;

async function insertSettings() {
  try {
    const settings = [
      {
        key: 'business_paybill',
        value: '100400',
        type: 'string',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'business_account_number',
        value: 'MH',
        type: 'string',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const setting of settings) {
      const exists = await db('settings').where('key', setting.key).first();
      if (!exists) {
        await db('settings').insert(setting);
        console.log(`Inserted ${setting.key}`);
      } else {
        console.log(`${setting.key} already exists`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

insertSettings();

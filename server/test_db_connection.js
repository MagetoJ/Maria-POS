
const { Client } = require('pg');
require('dotenv').config();

async function test(name, config) {
  console.log(`--- Testing: ${name} ---`);
  const client = new Client(config);
  try {
    await client.connect();
    console.log(`✅ ${name}: SUCCESS`);
    const res = await client.query('SELECT NOW()');
    console.log('Time:', res.rows[0].now);
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ ${name}: FAILED - ${err.message}`);
    return false;
  }
}

async function runTests() {
  const url = process.env.DATABASE_URL;
  
  // Test 1: Original with SSL rejectUnauthorized: false
  await test('Original SSL', {
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  // Test 2: SSL true
  await test('SSL true', {
    connectionString: url,
    ssl: true
  });

  // Test 3: No SSL in config (rely on URL if any)
  await test('No SSL config', {
    connectionString: url
  });

  // Test 4: With ?ssl=true in URL
  const urlWithSsl = url.includes('?') ? `${url}&ssl=true` : `${url}?ssl=true`;
  await test('URL with ?ssl=true', {
    connectionString: urlWithSsl,
    ssl: { rejectUnauthorized: false }
  });
}

runTests();

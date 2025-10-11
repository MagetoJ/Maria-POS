const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          path: path,
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        path: path,
        status: 'ERROR',
        data: error.message
      });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('Testing API endpoints after database schema fix...\n');
  
  const endpoints = [
    '/api/dashboard/overview-stats',
    '/api/reports/overview?start=2025-10-01&end=2025-10-11',
    '/api/reports/sales?start=2025-10-01&end=2025-10-11',
    '/api/reports/inventory?start=2025-10-01&end=2025-10-11',
    '/api/reports/staff?start=2025-10-01&end=2025-10-11',
    '/api/reports/rooms?start=2025-10-01&end=2025-10-11',
    '/api/staff'
  ];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint}`);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 500) {
      console.log(`❌ Still failing with 500 error`);
      console.log(`Response: ${result.data.substring(0, 200)}...`);
    } else if (result.status === 401 || result.status === 403) {
      console.log(`🔒 Authentication required (expected)`);
    } else if (result.status === 200) {
      console.log(`✅ Working correctly`);
    } else {
      console.log(`⚠️  Unexpected status: ${result.status}`);
    }
    console.log('---');
  }
}

testAllEndpoints();
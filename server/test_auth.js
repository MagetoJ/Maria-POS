const http = require('http');

// Test login first
function testLogin() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 'ERROR',
        data: error.message
      });
    });

    req.write(loginData);
    req.end();
  });
}

// Test protected endpoint with token
function testProtectedEndpoint(token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/dashboard/overview-stats',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 'ERROR',
        data: error.message
      });
    });

    req.end();
  });
}

async function testAuth() {
  console.log('=== Testing Authentication Flow ===\n');
  
  // Step 1: Login
  console.log('1. Testing login...');
  const loginResult = await testLogin();
  console.log('Login Status:', loginResult.status);
  
  if (loginResult.status === 200) {
    console.log('✅ Login successful');
    console.log('User:', loginResult.data.user?.username);
    console.log('Token exists:', !!loginResult.data.token);
    
    // Step 2: Test protected endpoint
    console.log('\n2. Testing protected endpoint...');
    const protectedResult = await testProtectedEndpoint(loginResult.data.token);
    console.log('Protected endpoint status:', protectedResult.status);
    
    if (protectedResult.status === 200) {
      console.log('✅ Authentication working correctly');
    } else if (protectedResult.status === 403) {
      console.log('❌ 403 Forbidden - Token might be invalid');
      console.log('Response:', protectedResult.data);
    } else {
      console.log('⚠️ Unexpected response');
      console.log('Response:', protectedResult.data);
    }
  } else {
    console.log('❌ Login failed');
    console.log('Response:', loginResult.data);
  }
}

testAuth();
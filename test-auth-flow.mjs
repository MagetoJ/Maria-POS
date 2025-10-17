// Test Authentication Flow
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  try {
    console.log('🧪 Testing authentication flow...');
    
    // 1. Test login
    console.log('\n1. Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Result:', loginResult);
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed, testing with different passwords...');
      
      // Try different passwords
      const passwords = ['admin', 'password', '123456', 'admin1234'];
      for (const password of passwords) {
        console.log(`  Trying password: "${password}"`);
        const testLogin = await fetch(`${BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password })
        });
        
        if (testLogin.ok) {
          const testResult = await testLogin.json();
          console.log(`✅ Login successful with password "${password}"`);
          console.log('User data:', testResult);
          
          // Test endpoints that are failing
          console.log('\n2. Testing /api/waiters endpoint (public)...');
          const waitersResponse = await fetch(`${BASE_URL}/api/waiters`);
          console.log('Waiters Response Status:', waitersResponse.status);
          
          if (waitersResponse.ok) {
            const waitersData = await waitersResponse.json();
            console.log('✅ Waiters data:', waitersData);
          } else {
            const errorText = await waitersResponse.text();
            console.log('❌ Waiters error:', errorText);
          }
          
          console.log('\n3. Testing /api/tables endpoint (protected)...');
          const tablesResponse = await fetch(`${BASE_URL}/api/tables`, {
            headers: {
              'Authorization': `Bearer ${testResult.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Tables Response Status:', tablesResponse.status);
          
          if (tablesResponse.ok) {
            const tablesData = await tablesResponse.json();
            console.log('✅ Tables data:', tablesData);
          } else {
            const errorText = await tablesResponse.text();
            console.log('❌ Tables error:', errorText);
          }
          
          // Test dashboard endpoint
          console.log('\n4. Testing dashboard endpoint...');
          const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard/overview-stats`, {
            headers: {
              'Authorization': `Bearer ${testResult.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Dashboard Response Status:', dashboardResponse.status);
          
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            console.log('✅ Dashboard data:', dashboardData);
          } else {
            const errorText = await dashboardResponse.text();
            console.log('❌ Dashboard error:', errorText);
          }
          return;
        }
      }
      
      console.log('❌ Could not find working password for admin user');
      return;
    }
    
    // If login was successful, test dashboard
    console.log('\n2. Testing dashboard endpoint...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard/overview-stats`, {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Dashboard Response Status:', dashboardResponse.status);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard data:', dashboardData);
    } else {
      const errorText = await dashboardResponse.text();
      console.log('❌ Dashboard error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAuthFlow();
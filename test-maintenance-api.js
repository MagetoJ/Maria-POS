// Test the maintenance API endpoint directly
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

async function testMaintenanceEndpoint() {
  try {
    console.log('🔍 Testing /api/maintenance-requests endpoint...');
    
    // First try to get a token (you'll need valid credentials)
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'manager',       // Use the manager from seed data
        password: 'password123'    // Password from seed data
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }
    
    const { token } = await loginResponse.json();
    console.log('✅ Login successful, got token');
    
    // Now test the maintenance endpoint
    const maintenanceResponse = await fetch(`${API_BASE}/maintenance-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Maintenance endpoint status:', maintenanceResponse.status);
    
    if (maintenanceResponse.ok) {
      const data = await maintenanceResponse.json();
      console.log('✅ Success! Found maintenance requests:', data.length);
    } else {
      const errorText = await maintenanceResponse.text();
      console.error('❌ Maintenance endpoint failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMaintenanceEndpoint();
// Quick test script to verify the API endpoints
const baseUrl = 'http://localhost:3000';

async function testAPI() {
    console.log('Testing API endpoints...\n');

    // Test health endpoint
    try {
        const healthResponse = await fetch(`${baseUrl}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health endpoint working:', healthData);
    } catch (error) {
        console.error('❌ Health endpoint error:', error.message);
    }

    // Test staff endpoint (should fail without auth)
    try {
        const staffResponse = await fetch(`${baseUrl}/api/staff`);
        console.log(`📋 Staff endpoint status: ${staffResponse.status}`);
        if (staffResponse.status === 401) {
            console.log('✅ Auth protection working correctly');
        }
    } catch (error) {
        console.error('❌ Staff endpoint error:', error.message);
    }
}

testAPI();
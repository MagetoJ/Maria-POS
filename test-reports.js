const axios = require('axios');

async function testReportsEndpoint() {
    try {
        // First login
        console.log('Logging in...');
        const loginResponse = await axios.post('/api/login', {
            username: 'admin',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('Login successful, got token');
        
        // Test overview report
        console.log('Testing overview report...');
        const reportResponse = await axios.get('/api/reports/overview?start=2024-12-01&end=2024-12-31', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Report data received:', JSON.stringify(reportResponse.data, null, 2));
        console.log('✓ Reports endpoint working correctly');
        
    } catch (error) {
        console.error('Error testing reports:', error.response?.data || error.message);
    }
}

testReportsEndpoint();
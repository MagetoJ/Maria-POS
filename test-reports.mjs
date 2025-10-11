async function testReportsEndpoint() {
    try {
        // First login
        console.log('Logging in...');
        const loginResponse = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('Login successful, got token');
        
        // Test overview report
        console.log('Testing overview report...');
        const reportResponse = await fetch('http://localhost:3000/api/reports/overview?start=2024-12-01&end=2024-12-31', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const reportData = await reportResponse.json();
        console.log('Report data received:', JSON.stringify(reportData, null, 2));
        console.log('✓ Reports endpoint working correctly');
        
    } catch (error) {
        console.error('Error testing reports:', error.message);
    }
}

testReportsEndpoint();
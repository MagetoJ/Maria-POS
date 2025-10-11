async function testStaffEndpoint() {
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
        
        // Test staff endpoint
        console.log('Testing staff endpoint...');
        const staffResponse = await fetch('http://localhost:3000/api/staff', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Staff endpoint status:', staffResponse.status);
        
        if (staffResponse.ok) {
            const staffData = await staffResponse.json();
            console.log('Staff data received:', JSON.stringify(staffData, null, 2));
        } else {
            const errorText = await staffResponse.text();
            console.log('Staff endpoint error:', errorText);
        }
        
    } catch (error) {
        console.error('Error testing staff endpoint:', error.message);
    }
}

testStaffEndpoint();
async function testPropertyCreation() {
    try {
        console.log('Starting test...');
        // Assume user login first to get a token
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com', // fallback
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.error('Login failed:', loginData);
            return;
        }

        const token = loginData.token;
        console.log('Login successful, token:', token.substring(0, 20) + '...');

        const payload = {
            propertyName: 'Test Property',
            address: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zip: '123456',
            type: 'House',
            totalUnits: 1,
            status: 'Active',
            images: ['data:image/jpeg;base64,aGVsbG8='] // Added a fake image
        };

        console.log('Sending property creation request...');
        const res = await fetch('http://localhost:5000/api/properties', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            console.log('Success:', data);
        } else {
            console.error('API Error:', data);
        }
    } catch (error) {
        console.error('Network/Script Error:', error.message);
    }
}

testPropertyCreation();

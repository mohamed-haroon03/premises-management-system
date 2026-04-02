async function testDelete() {
    try {
        console.log("Logging in...");
        let loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
        });

        let loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.log("Login failed, attempting to register instead...", loginData);
            const regRes = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'Landlord' })
            });
            loginData = await regRes.json();
        }

        const token = loginData.token;
        console.log("Got token.", token ? "yes" : "no");
        if (!token) {
            console.log("No token, exiting:");
            console.log(loginData);
            return;
        }

        console.log("Creating property...");
        const createRes = await fetch('http://localhost:5000/api/properties', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                propertyName: 'Test Delete Property',
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zip: '123456',
                type: 'House',
                totalUnits: 1,
                images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==']
            })
        });
        const createData = await createRes.json();

        const propertyId = createData._id;
        console.log("Created property ID:", propertyId, createData);

        if (!propertyId) return;

        console.log("Deleting property...");
        const deleteRes = await fetch(`http://localhost:5000/api/properties/${propertyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const deleteData = await deleteRes.json();

        console.log("Delete response (status code):", deleteRes.status);
        console.log("Delete data:", deleteData);
    } catch (error) {
        console.error("Error during test:", error);
    }
}

testDelete();

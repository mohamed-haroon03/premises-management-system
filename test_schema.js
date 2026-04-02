const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config({ path: './backend/.env' });

async function testUserCreation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to local MongoDB');

        // Try creating a test user with 'Landlord' role
        const testUser = new User({
            name: 'Test Landlord',
            email: 'testlandlord@example.com',
            password: 'password123',
            role: 'Landlord'
        });

        const validationError = testUser.validateSync();
        if (validationError) {
            console.error('Validation failed:', validationError.message);
        } else {
            console.log('Validation successful! Mongoose enum allows Landlord.');
            // await testUser.save(); // Don't actually save to keep DB clean
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testUserCreation();

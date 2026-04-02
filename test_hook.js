const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function testHook() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/property_management_test');
        console.log('Connected to local MongoDB');

        const testUser = new User({
            name: 'Test Landlord',
            email: 'testlandlord3@example.com',
            password: 'password123',
            role: 'Landlord'
        });

        await testUser.save();
        console.log('Save successful!');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
    }
}

testHook();

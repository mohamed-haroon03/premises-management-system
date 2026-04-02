const fs = require('fs');
const mongoose = require('mongoose');
const Property = require('./models/Property');
const User = require('./models/User');

async function test() {
    let out = [];
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
        const users = await User.find();
        for (const u of users) {
            const props = await Property.countDocuments({ owner: u._id, status: 'Active' });
            if (u.name.toLowerCase() === 'ishaaq') {
                out.push(`Email: ${u.email} -> Properties: ${props}`);
            }
        }

        fs.writeFileSync('db_check3.txt', out.join('\n'));
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('db_check3.txt', "ERROR: " + e.message);
        process.exit(1);
    }
}
test();

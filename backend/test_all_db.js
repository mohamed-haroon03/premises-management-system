const mongoose = require('mongoose');
const Property = require('./models/Property');
const User = require('./models/User');

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
    console.log("Connected to MongoDB.");
    const users = await User.find();
    console.log("Users:", users.map(u => ({ id: u._id, name: u.name, email: u.email })));

    const props = await Property.find();
    console.log("Properties count total:", props.length);
    if (props.length > 0) {
        console.log("First Property:", { id: props[0]._id, owner: props[0].owner, status: props[0].status });
    }
    process.exit(0);
}

test().catch(e => console.error(e));

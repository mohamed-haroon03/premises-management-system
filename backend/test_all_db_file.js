const fs = require('fs');
const mongoose = require('mongoose');
const Property = require('./models/Property');
const User = require('./models/User');

async function test() {
    let out = [];
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
        out.push("Connected");
        const users = await User.find();
        out.push(JSON.stringify(users.map(u => u.name)));

        const props = await Property.find();
        out.push("props: " + props.length);
        if (props.length) {
            out.push("prop[0] status: " + props[0].status);
        }

        fs.writeFileSync('db_check.txt', out.join('\n'));
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('db_check.txt', "ERROR: " + e.message);
        process.exit(1);
    }
}
test();

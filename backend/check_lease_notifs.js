const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
require('./models/Notification');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Notification = mongoose.model('Notification');
        const notifs = await Notification.find({ type: 'lease_alert' });
        fs.writeFileSync('notifs_lease.json', JSON.stringify(notifs, null, 2));
    } catch (e) {
        fs.writeFileSync('notifs_lease_err.txt', e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();

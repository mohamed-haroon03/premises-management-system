const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

require('./models/User');
require('./models/Property');
require('./models/Unit');
require('./models/Tenant');
const Notification = require('./models/Notification');
const RentContract = require('./models/RentContract');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const notifs = await Notification.find().sort({ createdAt: -1 }).limit(6);
        console.log('--- RECENT NOTIFICATIONS ---');
        notifs.forEach(n => console.log(n.title, ' | ', n.message, ' | ', n.type, ' | ', n.createdAt));

        const rents = await RentContract.find().sort({ updatedAt: -1 }).limit(2).populate('tenant').populate({ path: 'unit', populate: { path: 'property' } });
        console.log('\n--- RECENT RENTS ---');
        rents.forEach(r => {
            console.log(`Rent: ${r._id}, paymentDate: ${r.paymentDate}, status: ${r.status}, updatedAt: ${r.updatedAt}`);
            console.log(`Tenant: ${r.tenant?._id}, Property Owner: ${r.unit?.property?.owner}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();

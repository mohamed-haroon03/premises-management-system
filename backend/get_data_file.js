const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const LeaseContract = require('./models/LeaseContract.js');
const RentContract = require('./models/RentContract.js');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const leases = await LeaseContract.find();
        const rents = await RentContract.find();
        fs.writeFileSync('leases_rents_out.json', JSON.stringify({
            leases: leases.map(l => ({ id: l._id, status: l.status, endDate: l.endDate })),
            rents: rents.map(l => ({ id: l._id, status: l.status, endDate: l.endDate }))
        }, null, 2));
    } catch (e) {
        fs.writeFileSync('leases_rents_err.txt', e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();

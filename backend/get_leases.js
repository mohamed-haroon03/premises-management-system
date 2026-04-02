const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const LeaseContract = require('./models/LeaseContract.js');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const leases = await LeaseContract.find();
    console.log(leases.map(l => ({ id: l._id, status: l.status, endDate: l.endDate })));
    await mongoose.disconnect();
}
run();

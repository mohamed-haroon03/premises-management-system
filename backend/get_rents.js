const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const RentContract = require('./models/RentContract.js');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const rents = await RentContract.find();
    console.log(rents.map(l => ({ id: l._id, status: l.status, endDate: l.endDate })));
    await mongoose.disconnect();
}
run();

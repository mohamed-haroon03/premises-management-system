const fs = require('fs');
const mongoose = require('mongoose');
const Property = require('./models/Property');
const Unit = require('./models/Unit');
const RentContract = require('./models/RentContract');

async function testRent() {
    await mongoose.connect('mongodb://127.0.0.1:27017/property_management');

    const req = { user: { id: '699ac32dd6a3708cadb6096b' } }; // ibrah@gmail.com
    const properties = await Property.find({ owner: req.user.id, status: 'Active' });
    const propertyIds = properties.map(p => p._id);
    const units = await Unit.find({ property: { $in: propertyIds } });
    const unitIds = units.map(u => u._id);

    const activeRentContracts = await RentContract.find({
        unit: { $in: unitIds },
        status: 'Active'
    });

    let log = [];
    log.push("Active Rent Contracts Length: " + activeRentContracts.length);
    for (const c of activeRentContracts) {
        log.push("Contract: " + JSON.stringify(c, null, 2));
    }
    fs.writeFileSync('test_pending_out2.txt', log.join('\n'));
    process.exit(0);
}
testRent();

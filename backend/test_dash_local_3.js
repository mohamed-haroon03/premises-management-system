const fs = require('fs');
const mongoose = require('mongoose');
const Property = require('./models/Property');
const Unit = require('./models/Unit');
const LeaseContract = require('./models/LeaseContract');
const RentContract = require('./models/RentContract');
const Payment = require('./models/Payment');

async function testDash() {
    let log = [];
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
        log.push("Connected to MongoDB.");

        const req = { user: { id: '699ac32dd6a3708cadb6096b' } }; // The 'ibrah@gmail.com' id

        // Exact same query as dashboardRoutes
        const properties = await Property.find({ owner: req.user.id, status: 'Active' });
        log.push("Total Properties Array: " + JSON.stringify(properties));
        const propertyIds = properties.map(p => p._id);

        const units = await Unit.find({ property: { $in: propertyIds } });
        log.push("Total units: " + units.length);

        const activeLeases = await LeaseContract.countDocuments({
            unit: { $in: units.map(u => u._id) },
            status: 'Active'
        });
        log.push("Active leases: " + activeLeases);

        fs.writeFileSync('dash_api_log_db.txt', log.join('\n'));
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('dash_api_log_db_err.txt', e.stack);
        process.exit(1);
    }
}
testDash();

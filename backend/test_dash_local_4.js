const mongoose = require('mongoose');
const Property = require('./models/Property');
const Unit = require('./models/Unit');
const LeaseContract = require('./models/LeaseContract');
const RentContract = require('./models/RentContract');
const Payment = require('./models/Payment');

async function testDash() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
        const req = { user: { id: '699ac32dd6a3708cadb6096b' } }; // ibrah@gmail.com

        const properties = await Property.find({ owner: req.user.id, status: 'Active' });
        const totalProperties = properties.length;
        const propertyIds = properties.map(p => p._id);

        const units = await Unit.find({ property: { $in: propertyIds } });
        const totalUnits = units.length;
        const unitIds = units.map(u => u._id);

        const activeLeases = await LeaseContract.countDocuments({
            unit: { $in: unitIds },
            status: 'Active'
        });

        const occupiedUnits = activeLeases;
        const vacantUnits = totalUnits - occupiedUnits;
        const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0;

        // Simulate res.json
        const resData = {
            totalProperties,
            totalUnits,
            occupiedUnits,
            vacantUnits,
            occupancyRate,
            // (Mocking the rest for now since we just want to see totalProperties)
        };

        const fs = require('fs');
        fs.writeFileSync('dash_api_log_db_4_proper.txt', "Response Data:\n" + JSON.stringify(resData, null, 2), 'utf8');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testDash();

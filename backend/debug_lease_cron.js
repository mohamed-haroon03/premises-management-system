const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

require('./models/User');
require('./models/Tenant');
require('./models/Property');
require('./models/Unit');
require('./models/RentContract');
require('./models/LeaseContract');

async function run() {
    let log = [];
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const LeaseContract = mongoose.model('LeaseContract');
        const RentContract = mongoose.model('RentContract');

        const activeLeases = await LeaseContract.find({ status: 'Active' }).populate({ path: 'unit', populate: { path: 'property' } }).populate('tenant');
        const activeRents = await RentContract.find({ status: 'Active' }).populate({ path: 'unit', populate: { path: 'property' } }).populate('tenant');

        log.push('Active Leases: ' + activeLeases.length);
        activeLeases.forEach(lease => {
            log.push(`Lease [${lease._id}]:`);
            log.push(`  endDate: ${lease.endDate}`);
            log.push(`  tenant: ${!!lease.tenant}`);
            log.push(`  unit: ${!!lease.unit}`);
            log.push(`  property: ${lease.unit && lease.unit.property ? "yes" : "no"}`);
            if (!lease.endDate || !lease.unit || !lease.unit.property || !lease.tenant) {
                log.push('  => SKIPPED BY CRON');
            } else {
                log.push('  => WOULD PROCESS');
            }
        });

        log.push('Active Rents: ' + activeRents.length);
        activeRents.forEach(rent => {
            log.push(`Rent [${rent._id}]:`);
            log.push(`  endDate: ${rent.endDate}`);
            log.push(`  tenant: ${!!rent.tenant}`);
            log.push(`  unit: ${!!rent.unit}`);
            log.push(`  property: ${rent.unit && rent.unit.property ? "yes" : "no"}`);
            if (!rent.endDate || !rent.unit || !rent.unit.property || !rent.tenant) {
                log.push('  => SKIPPED BY CRON');
            } else {
                log.push('  => WOULD PROCESS');
            }
        });

    } catch (e) {
        log.push('Error: ' + e.message);
    } finally {
        fs.writeFileSync('lease_cron_debug.txt', log.join('\n'));
        mongoose.disconnect();
    }
}
run();

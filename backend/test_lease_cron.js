const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');

// Require all models used by the cron
require('./models/User');
require('./models/Tenant');
require('./models/Property');
require('./models/Unit');
require('./models/RentContract');
require('./models/LeaseContract');
require('./models/Notification');

const LeaseCronService = require('./services/leaseCron');

async function checkLeases() {
    let log = [];
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        log.push('Connected to DB');

        // Temporarily override console.log to capture it
        const originalLog = console.log;
        const originalError = console.error;
        console.log = (...args) => log.push(args.join(' '));
        console.error = (...args) => log.push('ERROR: ' + args.join(' '));

        await LeaseCronService.runCheck();

        console.log = originalLog;
        console.error = originalError;

        log.push('Lease check completed');
    } catch (err) {
        log.push('Outer Error: ' + err.message);
    } finally {
        fs.writeFileSync('lease_cron_result.txt', log.join('\n'));
        mongoose.disconnect();
    }
}
checkLeases();

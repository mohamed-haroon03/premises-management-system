const fs = require('fs');
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const RentContract = require('./models/RentContract');

async function testRent() {
    await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
    const contracts = await RentContract.find();
    let currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    // In our payload we used "April", but testing "March" because that's when we initially set up the RentContract payment.
    // Wait, the API adds payment with date "new Date().toISOString()" and month in Payload. 
    // Is current month March or April?
    // Let's test with 'April' as month instead of system month, because the user added April rent and checking pending rent.
    const monthRegex = new RegExp(currentMonth, 'i');
    const yearRegex = new RegExp(currentYear.toString());

    let log = [];
    log.push("Current Month: " + currentMonth);
    log.push("Current Year: " + currentYear);

    for (const contract of contracts) {
        log.push("Checking Contract: " + contract._id);
        const paymentsFound = await Payment.find({
            unit: contract.unit,
            tenant: contract.tenant,
            paymentCategory: 'Monthly Residential Rent',
            rentPaymentType: 'Monthly Rent',
            rentMonthYear: monthRegex,
            status: { $in: ['Paid', 'Late'] }
        });

        log.push("Payments Found Length for contract: " + paymentsFound.length);
        if (paymentsFound.length > 0) {
            log.push("First Payment Month Year: " + paymentsFound[0].rentMonthYear);
        }

        const thisMonthPayments = paymentsFound.filter(p => {
            if (!p.rentMonthYear) return false;
            if (yearRegex.test(p.rentMonthYear)) return true;
            if (!/\d{4}/.test(p.rentMonthYear)) return true;
            return false;
        });

        log.push("This Month Payments length: " + thisMonthPayments.length);
    }
    fs.writeFileSync('test_pending_out.txt', log.join('\n'));
    process.exit(0);
}
testRent();

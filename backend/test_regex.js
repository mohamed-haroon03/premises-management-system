const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const RentContract = require('./models/RentContract');

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
    console.log("Connected");

    try {
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();

        console.log("currentMonth:", currentMonth);
        console.log("currentYear:", currentYear);

        const monthRegex = new RegExp(currentMonth, 'i');
        const yearRegex = new RegExp(currentYear.toString());

        const paymentsFound = await Payment.find({
            paymentCategory: 'Monthly Residential Rent',
            rentMonthYear: { $regex: monthRegex, $options: 'i' },
            status: 'Paid'
        });

        console.log("Found payments:", paymentsFound.length);
    } catch (e) {
        console.error("ERROR:", e);
    }

    process.exit(0);
}

test();

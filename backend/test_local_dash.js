const mongoose = require('mongoose');
const Property = require('./models/Property');
const Unit = require('./models/Unit');
const LeaseContract = require('./models/LeaseContract');
const RentContract = require('./models/RentContract');
const Payment = require('./models/Payment');
const User = require('./models/User');

async function testDash() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
        console.log("Connected to MongoDB");

        const user = await User.findOne();
        if (!user) {
            console.log("No user found.");
            process.exit(1);
        }
        console.log("Found user:", user._id);

        const req = { user: { id: user._id } };

        const properties = await Property.find({ owner: req.user.id });
        console.log("Total Properties:", properties.length);
        const propertyIds = properties.map(p => p._id);

        const units = await Unit.find({ property: { $in: propertyIds } });
        console.log("Total units:", units.length);

        const activeLeases = await LeaseContract.countDocuments({
            unit: { $in: units.map(u => u._id) },
            status: 'Active'
        });
        console.log("Active leases:", activeLeases);

        // Calculate Pending Rent
        const activeRentContracts = await RentContract.find({
            unit: { $in: units.map(u => u._id) },
            status: 'Active'
        });
        console.log("activeRentContracts:", activeRentContracts.length);

        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();
        let totalPendingRent = 0;

        for (const contract of activeRentContracts) {
            const monthRegex = new RegExp(currentMonth, 'i');
            const yearRegex = new RegExp(currentYear.toString());

            const paymentsFound = await Payment.find({
                unit: contract.unit,
                tenant: contract.tenant,
                paymentCategory: 'Monthly Residential Rent',
                rentMonthYear: { $regex: monthRegex, $options: 'i' },
                status: 'Paid'
            });

            const thisMonthPayments = paymentsFound.filter(p => p.rentMonthYear && yearRegex.test(p.rentMonthYear));
            const totalPaidThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amountPaid, 0);

            if (totalPaidThisMonth < contract.monthlyRentAmount) {
                totalPendingRent += (contract.monthlyRentAmount - totalPaidThisMonth);
            }
        }
        console.log("Total pending rent:", totalPendingRent);

        console.log("Dashboard works successfully.");
        process.exit(0);
    } catch (e) {
        console.error("DASHBOARD ERROR:", e);
        process.exit(1);
    }
}
testDash();

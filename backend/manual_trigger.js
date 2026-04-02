const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const RentContract = require('./models/RentContract');
const NotificationService = require('./services/NotificationService');

async function triggerCron() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const today = new Date().getDate();
        console.log(`Checking for due rents on the ${today}th...`);

        const dueRents = await RentContract.find({
            status: 'Active',
            paymentDate: today
        }).populate({
            path: 'unit',
            populate: { path: 'property' }
        });

        console.log(`Found ${dueRents.length} active rent contracts due today.`);

        let notificationCount = 0;

        for (const rent of dueRents) {
            if (rent.tenant && rent.unit && rent.unit.property) {
                await NotificationService.createRentReminder(
                    rent.tenant._id,
                    rent.unit.property.propertyName || 'your property',
                    rent.monthlyRentAmount
                );
                notificationCount++;
                console.log(`Generated notification for tenant ${rent.tenant._id}`);
            } else {
                console.log(`Rent contract ${rent._id} is missing tenant, unit, or property info.`);
            }
        }

        console.log(`Total generated: ${notificationCount}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

triggerCron();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const RentContract = require('./models/RentContract');
const Notification = require('./models/Notification');

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const today = new Date().getDate();
        const rents = await RentContract.find({});
        console.log(`Total rents: ${rents.length}`);
        console.log('Rent Dates:', rents.map(r => r.paymentDate));

        const dueRents = await RentContract.find({ status: 'Active', paymentDate: today });
        console.log(`Rents due today (${today}): ${dueRents.length}`);

        const notifs = await Notification.find({ type: 'rent_due' });
        console.log(`Rent notifications in DB: ${notifs.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();

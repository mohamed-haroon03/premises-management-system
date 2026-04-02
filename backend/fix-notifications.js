const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const PropertyTax = require('./models/PropertyTax');
require('dotenv').config();

const uri = "mongodb://ishaaqm216_db_user:Admin123@ac-ioxpmsi-shard-00-00.rbzo8se.mongodb.net:27017,ac-ioxpmsi-shard-00-01.rbzo8se.mongodb.net:27017,ac-ioxpmsi-shard-00-02.rbzo8se.mongodb.net:27017/property_management?ssl=true&replicaSet=atlas-3c6mld-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to DB...');
        const notifications = await Notification.find({ type: 'tax_due' });
        let updatedCount = 0;

        for (const notif of notifications) {
            // Only update if referenceId is actually a PropertyTax ID
            if (notif.referenceId) {
                const tax = await PropertyTax.findById(notif.referenceId);
                if (tax && tax.property) {
                    notif.referenceId = tax.property;
                    await notif.save();
                    console.log('Fixed old notification:', notif.title);
                    updatedCount++;
                }
            }
        }

        console.log(`Updated ${updatedCount} old tax_due notifications with correct property ID.`);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

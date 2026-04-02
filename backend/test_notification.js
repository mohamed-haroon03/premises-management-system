const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Payment = require('./models/Payment');
const Unit = require('./models/Unit');
const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Token generation helper
function generateToken() {
    const payload = { id: '699ac32dd6a3708cadb6096b' }; // Assuming ibrah owner ID
    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
}

async function testNotif() {
    await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
    let log = [];
    try {
        const unit = await Unit.findOne();
        if (!unit) {
            log.push("No unit found to test");
            fs.writeFileSync('test_notif_out.txt', log.join('\n'));
            process.exit(0);
        }

        const token = generateToken();
        log.push("Generated Token");

        // 1. Create a fake notification for the unit
        const testNotification = new Notification({
            user: '699ac32dd6a3708cadb6096b',
            title: 'Test Rent Due',
            message: 'Rent is due',
            type: 'rent_due',
            referenceId: unit._id,
            isRead: false
        });
        await testNotification.save();
        log.push(`Created Notification ID: ${testNotification._id} for Unit: ${unit._id}`);

        // 2. Fetch notifications to verify it's there
        const notifBefore = await Notification.findById(testNotification._id);
        log.push(`Notification Before Payment isRead: ${notifBefore.isRead}`);

        // 3. Make a payment
        const paymentPayload = {
            paymentCategory: 'Monthly Residential Rent',
            tenant: '69abe3b67c2ae1834c622f3a', // random tenant id from db, doesn't matter much for backend check except maybe validation
            unit: unit._id,
            amountPaid: 500,
            paymentDate: new Date(),
            paymentMethod: 'Cash',
            rentPaymentType: 'Monthly Rent',
            rentMonthYear: 'TestMonth',
            status: 'Paid'
        };

        const res = await axios.post('http://localhost:5000/api/payments', paymentPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        log.push(`Payment Created: ${res.data._id}`);

        // 4. Verify notification is now read
        const notifAfter = await Notification.findById(testNotification._id);
        log.push(`Notification After Payment isRead: ${notifAfter.isRead}`);

        fs.writeFileSync('test_notif_out.txt', log.join('\n'));
        console.log("Test finished, output in test_notif_out.txt");
    } catch (e) {
        log.push(`Error: ${e.message}`);
        if (e.response) log.push(JSON.stringify(e.response.data));
        fs.writeFileSync('test_notif_out.txt', log.join('\n'));
    }
    process.exit(0);
}

testNotif();

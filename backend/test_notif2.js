const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Payment = require('./models/Payment');
const Unit = require('./models/Unit');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Token generation helper
function generateToken() {
    const payload = { id: '699ac32dd6a3708cadb6096b' }; // Assuming ibrah owner ID
    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
}

async function testNotif() {
    try {
        const token = generateToken();
        const unitId = '69abe3d57c2ae1834c622f56'; // from t2.txt

        // 3. Make a payment
        const paymentPayload = {
            paymentCategory: 'Monthly Residential Rent',
            tenant: '69abe3b67c2ae1834c622f3a', // random tenant id
            unit: unitId,
            amountPaid: 500,
            paymentDate: new Date(),
            paymentMethod: 'Cash',
            rentPaymentType: 'Monthly Rent',
            rentMonthYear: 'TestMonth2',
            status: 'Paid'
        };

        const res = await axios.post('http://localhost:5000/api/payments', paymentPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Payment Created: ${res.data._id}`);

        // 4. Verify notification is now read via mongoose
        await mongoose.connect('mongodb://127.0.0.1:27017/property_management');
        const notifAfter = await Notification.findById('69ac0cdc6d06493bff8c4e0b');
        console.log(`Notification After Payment isRead: ${notifAfter.isRead}`);

        process.exit(0);
    } catch (e) {
        console.log(`Error: ${e.message}`);
        if (e.response && e.response.data) console.log(JSON.stringify(e.response.data));
        process.exit(1);
    }
}

testNotif();

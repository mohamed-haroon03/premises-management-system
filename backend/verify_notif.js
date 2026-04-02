const fs = require('fs');
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Payment = require('./models/Payment');

async function testIt() {
    let log = [];
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/property_management');

        const unitId = '69abe3d57c2ae1834c622f56';

        const myPayment = new Payment({
            paymentCategory: 'Monthly Residential Rent',
            tenant: '69abe3b67c2ae1834c622f3a',
            unit: unitId,
            amountPaid: 800,
            paymentDate: new Date(),
            paymentMethod: 'Cash',
            rentPaymentType: 'Monthly Rent',
            rentMonthYear: 'May',
            status: 'Paid'
        });

        await myPayment.save();
        log.push('Payment saved');

        if (myPayment.unit) {
            const updateRes = await Notification.updateMany(
                { type: 'rent_due', referenceId: myPayment.unit },
                { isRead: true }
            );
            log.push('Update Res: ' + JSON.stringify(updateRes));
        }

        const notifAfter = await Notification.findById('69ac0cdc6d06493bff8c4e0b');
        if (notifAfter) {
            log.push(`Notification After Payment isRead: ${notifAfter.isRead}`);
        } else {
            log.push('Notif not found');
        }

    } catch (e) {
        log.push('Err: ' + e.message);
    }

    fs.writeFileSync('verify.txt', log.join('\n'));
    process.exit(0);
}

testIt();

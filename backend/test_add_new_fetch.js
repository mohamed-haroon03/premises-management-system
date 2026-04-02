const fs = require('fs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
    let log = [];
    try {
        const token = jwt.sign({ id: '699ac32dd6a3708cadb6096b' }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');

        // Add payment for April
        const postRes = await fetch('http://localhost:5000/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                paymentCategory: 'Monthly Residential Rent',
                tenant: '69abe3b67c2ae1834c622f3a',
                unit: '69abe3e17c2ae1834c622f59',
                amountPaid: 4000,
                paymentDate: new Date().toISOString(),
                paymentMethod: 'Cash',
                rentPaymentType: 'Monthly Rent',
                rentMonthYear: 'April',
                status: 'Paid'
            })
        });
        const postData = await postRes.json();
        log.push("Post res: " + JSON.stringify(postData));

        // Get dashboard
        const res = await fetch('http://localhost:5000/api/dashboard/owner', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const resData = await res.json();

        log.push("Pending Rent: " + resData.pendingRent);
        log.push("Monthly Income: " + resData.monthlyIncome);
    } catch (err) {
        log.push(err.message);
    }
    fs.writeFileSync('test_add_new_fetch.txt', log.join('\n'));
}
run();

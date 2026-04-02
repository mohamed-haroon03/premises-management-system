const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
    try {
        const token = jwt.sign({ id: '699ac32dd6a3708cadb6096b' }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');

        // Add payment for March
        console.log("Adding payment...");
        await axios.post('http://localhost:5000/api/payments', {
            paymentCategory: 'Monthly Residential Rent',
            tenant: '69abe3b67c2ae1834c622f3a',
            unit: '69abe3e17c2ae1834c622f59',
            amountPaid: 4000,
            paymentDate: new Date().toISOString(),
            paymentMethod: 'Cash',
            rentPaymentType: 'Monthly Rent',
            rentMonthYear: 'March',
            status: 'Paid'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Get dashboard
        console.log("Fetching dashboard...");
        const res = await axios.get('http://localhost:5000/api/dashboard/owner', {
            headers: { Authorization: `Bearer ${token}` }
        });

    } catch (err) {
        log.push("Error occurred");
        if (err.response) {
            log.push(JSON.stringify(err.response.data));
        } else {
            log.push(err.message);
        }
    }
    const fs = require('fs');
    fs.writeFileSync('result.txt', log.join('\n'));
}
run();

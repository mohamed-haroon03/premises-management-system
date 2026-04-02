const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
    try {
        const token = jwt.sign({ id: '699ac32dd6a3708cadb6096b' }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');

        // Add payment for April
        const postRes = await axios.post('http://localhost:5000/api/payments', {
            paymentCategory: 'Monthly Residential Rent',
            tenant: '69abe3b67c2ae1834c622f3a',
            unit: '69abe3e17c2ae1834c622f59',
            amountPaid: 4000,
            paymentDate: new Date().toISOString(),
            paymentMethod: 'Cash',
            rentPaymentType: 'Monthly Rent',
            rentMonthYear: 'April',
            status: 'Paid'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Post res: ", postRes.data);

        // Get dashboard
        const res = await axios.get('http://localhost:5000/api/dashboard/owner', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Pending Rent:", res.data.pendingRent);
        console.log("Monthly Income:", res.data.monthlyIncome);
    } catch (err) {
        if (err.response) {
            console.log(JSON.stringify(err.response.data));
        } else {
            console.log(err.message);
        }
    }
}
run();

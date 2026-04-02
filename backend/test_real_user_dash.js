const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
    try {
        const token = jwt.sign({ id: '699ac32dd6a3708cadb6096b' }, process.env.JWT_SECRET || 'fallback_secret');
        console.log("Token:", token);
        const res = await axios.get('http://localhost:5000/api/dashboard/owner', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Dashboard Data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.error("API Error:", err.response.data);
        } else {
            console.error("Error:", err.message);
        }
    }
}
run();

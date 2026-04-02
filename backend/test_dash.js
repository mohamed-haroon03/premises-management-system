const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
    try {
        const token = jwt.sign({ id: '65e6d8aebbd4c0fa649d28ea' }, process.env.JWT_SECRET || 'fallback_secret');
        console.log("Token:", token);
        const res = await axios.get('http://localhost:5000/api/dashboard/owner', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Dashboard Data:", res.data);
    } catch (err) {
        if (err.response) {
            console.error("API Error:", err.response.data);
        } else {
            console.error("Error:", err.message);
        }
    }
}
run();

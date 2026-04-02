const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
    let log = [];
    try {
        const token = jwt.sign({ id: '699ac32dd6a3708cadb6096b' }, process.env.JWT_SECRET || 'fallback_secret');
        log.push("Token: " + token);
        const res = await axios.get('http://localhost:5000/api/dashboard/owner', {
            headers: { Authorization: `Bearer ${token}` }
        });
        log.push("Dashboard Data: " + JSON.stringify(res.data, null, 2));
    } catch (err) {
        if (err.response) {
            log.push("API Error: " + JSON.stringify(err.response.data));
        } else {
            log.push("Error: " + err.message);
        }
    }
    fs.writeFileSync('dash_api_log.txt', log.join('\n'));
}
run();

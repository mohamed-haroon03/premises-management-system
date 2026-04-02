const fs = require('fs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
    let log = [];
    try {
        const token = jwt.sign({ id: '699ac32dd6a3708cadb6096b' }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');
        log.push("Token: " + token);
        const res = await fetch('http://localhost:5000/api/dashboard/owner', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
            log.push("API Error: " + JSON.stringify(data));
        } else {
            log.push("Dashboard Data: " + JSON.stringify(data, null, 2));
        }
    } catch (err) {
        log.push("Error: " + err.message);
        log.push("Stack: " + err.stack);
    }
    fs.writeFileSync('dash_api_log_real.txt', log.join('\n'));
}
run();

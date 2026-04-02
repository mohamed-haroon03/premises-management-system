const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
    try {
        const token = jwt.sign({ id: '699ac32dd6a3708cadb6096b' }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');
        const res = await axios.get('http://localhost:5000/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        fs.writeFileSync('notif_out.txt', JSON.stringify(res.data, null, 2));
    } catch (err) {
        fs.writeFileSync('notif_err.txt', err.message);
    }
}
run();

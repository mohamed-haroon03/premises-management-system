const mongoose = require('mongoose');

console.log("Environment URI:", process.env.MONGODB_URI);
const uri = 'mongodb+srv://Dbuser:admin@cluster0.neffkhu.mongodb.net/?appName=Cluster0';
console.log("Using URI:", uri);

mongoose.connect(uri)
    .then(() => {
        console.log("Successfully connected to MongoDB");
        process.exit(0);
    })
    .catch(err => {
        console.error("MongoDB Connection Error:");
        console.error("Name:", err.name);
        console.error("Message:", err.message);
        console.error("Code:", err.code);
        if (err.cause) console.error("Cause:", err.cause);
        process.exit(1);
    });

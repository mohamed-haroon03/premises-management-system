const { MongoClient } = require('mongodb');

async function run() {
    const uri = "mongodb+srv://Dbuser:admin@cluster0.neffkhu.mongodb.net/?appName=Cluster0";
    const client = new MongoClient(uri);

    try {
        console.log("Connecting...");
        await client.connect();
        console.log("Connected successfully to server");
    } catch (error) {
        console.error("Connection failed!");
        console.error(error);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);

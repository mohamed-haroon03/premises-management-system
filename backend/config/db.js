const mongoose = require('mongoose');
const dns = require('dns');

// Set DNS servers to Google & Cloudflare to resolve SRV records reliably on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore DNS set errors if not permitted
}

let mongodInstance = null;

const connectDB = async () => {
  const primaryURI = process.env.MONGODB_URI;

  if (primaryURI) {
    try {
      console.log('Connecting to primary MongoDB URI...');
      await mongoose.connect(primaryURI, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000
      });
      console.log('✅ Connected to Primary MongoDB Cluster successfully!');
      return;
    } catch (err) {
      console.warn('⚠️ Primary MongoDB connection failed:', err.message);
      console.warn('Attempting local/in-memory fallback...');
    }
  }

  // Fallback 1: Try local MongoDB service if available
  const localURI = 'mongodb://127.0.0.1:27017/property_management';
  try {
    console.log('Trying local MongoDB at 127.0.0.1:27017...');
    await mongoose.connect(localURI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    console.log('✅ Connected to Local MongoDB!');
    return;
  } catch (err) {
    console.warn('Local MongoDB not available at 127.0.0.1:27017');
  }

  // Fallback 2: In-memory MongoDB server
  try {
    console.log('Starting MongoMemoryServer as fallback...');
    const { MongoMemoryServer } = require('mongodb-memory-server-core');
    mongodInstance = await MongoMemoryServer.create({
      binary: { version: '4.4.26' }
    });
    const memoryUri = mongodInstance.getUri();
    console.log('In-Memory MongoDB started at:', memoryUri);
    await mongoose.connect(memoryUri);
    console.log('✅ Connected to In-Memory MongoDB successfully!');
  } catch (memErr) {
    console.error('❌ Failed to start In-Memory MongoDB:', memErr.message);
  }
};

module.exports = connectDB;

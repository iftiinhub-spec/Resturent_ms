const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/offline_restaurant_db?directConnection=true';
    const conn = await mongoose.connect(uri, {
      directConnection: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Offline MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Offline MongoDB Error]: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

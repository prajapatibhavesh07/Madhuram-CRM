const mongoose = require("mongoose");

// Disable buffering so that commands fail immediately if the DB is disconnected
// instead of waiting for 30s (default) or 10s (buffer timeout)
mongoose.set('bufferCommands', false);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error("MongoDB connection failed. Please ensure MongoDB is running at " + process.env.MONGO_URI);
        console.error("Error Detail:", error.message);
        return null;
    }
};

module.exports = connectDB;

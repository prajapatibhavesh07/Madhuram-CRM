const User = require("../models/User");
const mongoose = require("mongoose");

const authenticate = async (req, res, next) => {
    // Check if database is connected before proceeding
    if (mongoose.connection.readyState !== 1) {
        console.error("[AUTH] Database disconnected. Skipping DB operation.");
        return res.status(503).json({ 
            message: "Database service is currently unavailable. Please check if MongoDB is running.",
            error: "ECONNREFUSED" 
        });
    }

    const userId = req.header("User-Id");

    if (!userId || userId === "undefined" || userId === "null") {
        return res.status(401).json({ message: "Authentication required. Please login again." });
    }

    try {
        if (userId.length !== 24 && !/^[0-9a-fA-F]{24}$/.test(userId)) {
            return res.status(401).json({ message: "Invalid session format. Please login again." });
        }

        const user = await User.findById(userId);
        if (user) {
            req.user = user;
            return next();
        } else {
            console.log(`[AUTH] User NOT found for ID: ${userId}`);
            return res.status(401).json({ message: "Invalid session. Please login again." });
        }
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(500).json({ error: "Internal server error during authentication" });
    }
};

module.exports = authenticate;

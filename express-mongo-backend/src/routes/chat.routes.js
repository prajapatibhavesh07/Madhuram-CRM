const express = require("express");
const router = express.Namespace ? express.Router({ mergeParams: true }) : express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const authenticate = require("../middleware/authMiddleware");

// Get messages between two users
router.get("/history/:otherUserId", authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const { otherUserId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: userId, recipient: otherUserId },
                { sender: otherUserId, recipient: userId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Fetch Chat History Error:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

// Get list of users available for chat (excluding Normal Users and current user)
router.get("/users", authenticate, async (req, res) => {
    try {
        if (req.user.role === "Normal User") {
            return res.status(403).json({ message: "Normal users cannot access chat" });
        }

        const users = await User.find({
            role: { $ne: "Normal User" },
            _id: { $ne: req.user._id }
        }).select("name username role isOnline");

        // Enhance with last message data
        const enhancedUsers = await Promise.all(users.map(async (u) => {
            const lastMsg = await Message.findOne({
                $or: [
                    { sender: req.user._id, recipient: u._id },
                    { sender: u._id, recipient: req.user._id }
                ]
            }).sort({ createdAt: -1 });

            return {
                ...u.toObject(),
                lastMessage: lastMsg ? lastMsg.text : null,
                lastMessageTime: lastMsg ? lastMsg.createdAt : null
            };
        }));

        res.json(enhancedUsers);
    } catch (error) {
        console.error("Fetch Chat Users Error:", error);
        res.status(500).json({ error: "Failed to fetch chat users" });
    }
});

module.exports = router;

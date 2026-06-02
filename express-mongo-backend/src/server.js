require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const socketIO = require("./config/socket");
const io = socketIO.init(server);

// Socket.io connection handling
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    let currentUserId = null;

    socket.on("join", async (userId) => {
        try {
            const user = await User.findById(userId);
            if (user && user.role !== "Normal User") {
                currentUserId = userId;
                socket.join(userId);

                // Update online status
                await User.findByIdAndUpdate(userId, { isOnline: true });
                console.log(`User ${userId} joined their private room and marked online`);

                // Broadcast update to all
                io.emit("user_status_changed", { userId, isOnline: true });
            } else {
                console.log(`User ${userId} (Normal User or not found) tried to join`);
                socket.disconnect();
            }
        } catch (err) {
            console.error("Socket join error:", err);
        }
    });

    socket.on("send_message", async (data) => {
        const { senderId, recipientId, text } = data;
        try {
            const newMessage = await Message.create({
                sender: senderId,
                recipient: recipientId,
                text
            });

            // Emit to recipient if online
            io.to(recipientId).emit("receive_message", newMessage);
            // Emit back to sender
            io.to(senderId).emit("message_sent", newMessage);
        } catch (err) {
            console.error("Send message error:", err);
        }
    });

    socket.on("disconnect", async () => {
        console.log("User disconnected:", socket.id);
        if (currentUserId) {
            try {
                await User.findByIdAndUpdate(currentUserId, { isOnline: false });
                io.emit("user_status_changed", { userId: currentUserId, isOnline: false });
                console.log(`User ${currentUserId} marked offline`);
            } catch (err) {
                console.error("Disconnect status update error:", err);
            }
        }
    });
});

// Connect to Database and start server
connectDB().then((conn) => {
    if (conn) {
        console.log("MongoDB Ready");
        
        // Initialize Automation Service only after DB is ready
        const automationService = require("./services/automationService");
        automationService.start();

        // Initialize CRON Service
        const cronService = require("./services/cronService");
        cronService.init();

        const PORT = process.env.PORT || 5000;
        server.listen(PORT, '0.0.0.0', () => {
            console.log("SERVER_UP_" + PORT);
        });
    } else {
        console.log("MongoDB Not Connected - Server not started");
        process.exit(1);
    }
});

let io;

module.exports = {
    init: (httpServer) => {
        const { Server } = require("socket.io");
        io = new Server(httpServer, {
            cors: {
                origin: process.env.ALLOWED_ORIGIN || "*",
                methods: ["GET", "POST"]
            }
        });
        return io;
    },
    getIO: () => {
        if (!io) {
            // It's okay to return undefined if not initialized yet
            return null;
        }
        return io;
    }
};

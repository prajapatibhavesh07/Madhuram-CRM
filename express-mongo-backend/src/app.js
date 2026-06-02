const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const userRoutes = require("./routes/user.routes");
const candidateRoutes = require("./routes/candidate.routes");
const optionRoutes = require("./routes/option.routes");
const folderRoutes = require("./routes/folder.routes");
const fileRoutes = require("./routes/file.routes");

const app = express();

// Middleware
// Security HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "frame-ancestors": ["'self'", "http://localhost:3000", "http://localhost:5173"],
            "img-src": ["'self'", "data:", "blob:", "http://localhost:5000"],
            "frame-src": ["'self'", "http://localhost:5000"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compress all responses
app.use(compression());

// CORS configuration for production
const corsOptions = {
    origin: process.env.ALLOWED_ORIGIN || '*',
    allowedHeaders: ['Content-Type', 'Authorization', 'User-Id'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting globally
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes."
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/jobs", require("./routes/job.routes"));
app.use("/api/interviews", require("./routes/interview.routes"));
app.use("/api/offers", require("./routes/offer.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/leaves", require("./routes/leave.routes"));
app.use("/api/payroll", require("./routes/payroll.routes"));
app.use("/api/settings", require("./routes/settings.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/operations", require("./routes/operation.routes"));
app.use("/api/tasks", require("./routes/task.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/audit-logs", require("./routes/audit.routes"));
app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/call-history", require("./routes/callHistory"));
app.use("/api/roles", require("./routes/role.routes"));


// Health check
app.get("/", (req, res) => {
    res.json({ status: "API is running" });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
        error: {
            message: isProduction ? 'Internal Server Error' : err.message,
            ...(isProduction ? {} : { stack: err.stack })
        }
    });
});

module.exports = app;

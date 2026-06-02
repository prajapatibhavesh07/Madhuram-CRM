const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Import all relevant models
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const Task = require("../models/Task");
const TaskComment = require("../models/TaskComment");
const CallHistory = require("../models/CallHistory");
const OfferLetter = require("../models/OfferLetter");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const LeaveBalance = require("../models/LeaveBalance");
const Payroll = require("../models/Payroll");
const Notification = require("../models/Notification");
const Interview = require("../models/Interview");
const AuditLog = require("../models/AuditLog");

const clearData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for clearing data...");

        console.log("Clearing Candidate data...");
        await Candidate.deleteMany({});
        
        console.log("Clearing Jobs data...");
        await Job.deleteMany({});
        
        console.log("Clearing Tasks and Task Comments data...");
        await Task.deleteMany({});
        await TaskComment.deleteMany({});
        
        console.log("Clearing Call History data...");
        await CallHistory.deleteMany({});
        
        console.log("Clearing Offers data...");
        await OfferLetter.deleteMany({});
        
        console.log("Clearing Attendance data...");
        await Attendance.deleteMany({});
        
        console.log("Clearing Leaves and Leave Balances data...");
        await Leave.deleteMany({});
        await LeaveBalance.deleteMany({});
        
        console.log("Clearing Payroll data...");
        await Payroll.deleteMany({});
        
        console.log("Clearing Notification data...");
        await Notification.deleteMany({});
        
        console.log("Clearing related Interview data...");
        await Interview.deleteMany({});

        console.log("Clearing Audit Logs...");
        await AuditLog.deleteMany({});

        console.log("All requested data cleared successfully!");
        process.exit();
    } catch (error) {
        console.error("Error clearing data:", error);
        process.exit(1);
    }
};

clearData();

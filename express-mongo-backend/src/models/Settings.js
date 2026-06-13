const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    smtp: {
        host: { type: String, default: "" },
        port: { type: Number, default: 587 },
        username: { type: String, default: "" },
        password: { type: String, default: "" },
        encryption: { type: String, enum: ["None", "SSL", "TLS"], default: "TLS" },
        from: { type: String, default: "" }
    },
    emails: {
        support: String,
        info: String,
        hr: String,
        billing: String
    },
    general: {
        companyName: { type: String, default: "CRM Enterprise" },
        website: String,
        dateFormat: { type: String, default: "DD/MM/YYYY" },
        companyLogo: { type: String, default: "" }
    },
    attendance: {
        workingDays: { type: [String], default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
        shiftStart: { type: String, default: "09:00" },
        shiftEnd: { type: String, default: "18:00" },
        halfDayThreshold: { type: String, default: "11:00" }
    },
    leavePolicy: {
        casualLeaveDays: { type: Number, default: 12 },
        sickLeaveDays: { type: Number, default: 12 },
        earnedLeaveDays: { type: Number, default: 15 },
        paternityLeaveDays: { type: Number, default: 15 },
        maternityLeaveDays: { type: Number, default: 90 },
        customLeaveTypes: [{
            name: { type: String, required: true },
            days: { type: Number, required: true }
        }],
        enableSandwichRule: { type: Boolean, default: false }
    },
    payroll: {
        logo: { type: String, default: "" }, // Base64 string
        address: { type: String, default: "" },
        contact: {
            email: { type: String, default: "" },
            phone: { type: String, default: "" }
        },
        footerText: { type: String, default: "" }
    },
    apiKeys: {
        openai: { type: String, default: "" },
        twilioSid: { type: String, default: "" },
        twilioToken: { type: String, default: "" },
        twilioPhone: { type: String, default: "" },
        googleMapsKey: { type: String, default: "" },
        appSecurityKey: { type: String, default: "" },
        encryptionSecret: { type: String, default: "" }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Settings", settingsSchema);

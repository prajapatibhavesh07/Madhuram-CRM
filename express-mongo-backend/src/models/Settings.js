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
        website: String
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

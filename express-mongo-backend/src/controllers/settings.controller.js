const Settings = require("../models/Settings");

exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = new Settings({
                smtp: {
                    host: process.env.SMTP_HOST || '',
                    port: process.env.SMTP_PORT || 587,
                    username: process.env.SMTP_USER || '',
                    password: process.env.SMTP_PASS || '',
                    encryption: 'TLS',
                    from: process.env.SMTP_FROM || ''
                }
            });
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (settings) {
            settings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true });
        } else {
            settings = new Settings(req.body);
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getPublicSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne().select('general');
        res.json(settings || { general: { companyName: "CRM Enterprise", companyLogo: "" } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

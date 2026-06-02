const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
    try {
        const { module, action, userId, startDate, endDate } = req.query;
        const query = {};

        if (module) query.module = module;
        if (action) query.action = action;
        if (userId) query.user = userId;
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .limit(500); // Limit to last 500 logs for performance

        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLogsByRecord = async (req, res) => {
    try {
        const { targetId } = req.params;
        const logs = await AuditLog.find({ targetId })
            .populate('user', 'name email role')
            .sort({ createdAt: -1 });
        
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

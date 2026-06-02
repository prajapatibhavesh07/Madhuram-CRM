const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'MOVED', 'LOGIN', 'LOGOUT']
    },
    module: {
        type: String,
        required: true,
        enum: ['User', 'Candidate', 'Task', 'Job', 'Interview', 'Offer', 'Attendance', 'Leave', 'Payroll', 'Settings']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    targetModel: {
        type: String,
        required: true
    },
    changes: {
        type: Map,
        of: {
            old: mongoose.Schema.Types.Mixed,
            new: mongoose.Schema.Types.Mixed
        }
    },
    details: {
        type: String
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Indexing for faster queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, targetId: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

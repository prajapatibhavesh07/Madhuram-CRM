const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    casualLeave: { type: Number, default: 12 },
    sickLeave: { type: Number, default: 10 },
    earnedLeave: { type: Number, default: 0 },
    compOff: { type: Number, default: 0 },
    used: {
        casualLeave: { type: Number, default: 0 },
        sickLeave: { type: Number, default: 0 },
        earnedLeave: { type: Number, default: 0 },
        compOff: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

leaveBalanceSchema.index({ userId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // Normalized to midnight
    inTime: { type: Date },
    outTime: { type: Date },
    totalHours: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half Day', 'On Duty', 'Work From Home', 'Holiday', 'Weekend'],
        default: 'Absent'
    },
    overtime: { type: Number, default: 0 }, // In hours
    remarks: { type: String }
}, {
    timestamps: true
});

// Compound index to ensure one record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

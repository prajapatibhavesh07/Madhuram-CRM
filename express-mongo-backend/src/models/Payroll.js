const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    salaryComponents: {
        basic: { type: Number, default: 0 },
        hra: { type: Number, default: 0 },
        allowances: { type: Number, default: 0 },
        bonus: { type: Number, default: 0 },
        overtimePay: { type: Number, default: 0 },
        incentives: { type: Number, default: 0 }
    },
    deductions: {
        pf: { type: Number, default: 0 },
        esi: { type: Number, default: 0 },
        tds: { type: Number, default: 0 },
        advance: { type: Number, default: 0 },
        otherDeductions: { type: Number, default: 0 }
    },
    netSalary: { type: Number, required: true },
    workingDays: { type: Number, default: 30 },
    presentDays: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Draft', 'Processed', 'Paid'],
        default: 'Draft'
    },
    paymentDate: { type: Date },
    remarks: { type: String }
}, {
    timestamps: true
});

payrollSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);

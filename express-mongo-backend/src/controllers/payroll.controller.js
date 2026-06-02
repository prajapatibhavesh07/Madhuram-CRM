const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');
const PDFDocument = require('pdfkit');

exports.generatePayroll = async (req, res) => {
    try {
        const { userId, month, year, salaryComponents } = req.body;

        // Check if already exists
        let payroll = await Payroll.findOne({ userId, month, year });
        if (payroll && payroll.status === 'Paid') {
            return res.status(400).json({ message: 'Payroll already paid for this month' });
        }

        // Calculate Attendance
        // For simplicity, fetching count of Present days
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        const attendanceCount = await Attendance.countDocuments({
            userId,
            date: { $gte: startDate, $lte: endDate },
            status: { $in: ['Present', 'Half Day', 'On Duty', 'Work From Home'] } // Simplified
        });

        // Basic Calc Logic
        const totalEarnings = salaryComponents.basic + salaryComponents.hra + salaryComponents.allowances + (salaryComponents.incentives || 0);
        // Simple deduction logic based on attendance (pro-rata?) -> skipping for prototype
        // Assuming strict monthly salary for now using provided components

        const deductions = {
            pf: Math.round(salaryComponents.basic * 0.12),
            esi: Math.round(totalEarnings * 0.0075),
            tds: 0 // Placeholder
        };

        const totalDeductions = deductions.pf + deductions.esi + deductions.tds;
        const netSalary = totalEarnings - totalDeductions;

        if (payroll) {
            // Update draft
            payroll.salaryComponents = salaryComponents;
            payroll.deductions = deductions;
            payroll.netSalary = netSalary;
            payroll.presentDays = attendanceCount;
        } else {
            payroll = new Payroll({
                userId,
                month,
                year,
                salaryComponents,
                deductions,
                netSalary,
                presentDays: attendanceCount,
                status: 'Draft'
            });
        }

        await payroll.save();
        res.json(payroll);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPayrolls = async (req, res) => {
    try {
        const { month, year, userId } = req.query;
        const query = {};
        if (month) query.month = Number(month);
        if (year) query.year = Number(year);

        // Security: If not Admin/HR, forces filter to own userId
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const isAdminOrHR = req.user.role === 'Super Admin' || req.user.role === 'Admin' || req.user.role === 'HR';

        if (!isAdminOrHR) {
            query.userId = req.user._id;
        } else if (userId) {
            query.userId = userId;
        }

        const payrolls = await Payroll.find(query).populate('userId', 'name email').sort({ year: -1, month: -1 });
        res.json(payrolls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const payroll = await Payroll.findById(id);
        if (!payroll) return res.status(404).json({ message: 'Payroll not found' });

        payroll.status = status;
        if (status === 'Paid') {
            payroll.paymentDate = new Date();
        }

        await payroll.save();
        res.json(payroll);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.downloadPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const payroll = await Payroll.findById(id).populate('userId', 'name email employeeId department designation');
        if (!payroll) return res.status(404).json({ message: 'Payroll not found' });

        const settings = await Settings.findOne();
        const branding = settings?.payroll || {};
        const general = settings?.general || {};

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=payslip_${payroll.userId.name}_${payroll.month}_${payroll.year}.pdf`);

        doc.pipe(res);

        // Header
        if (branding.logo) {
            try {
                if (branding.logo.startsWith('data:image')) {
                    const base64Data = branding.logo.split(';base64,').pop();
                    doc.image(Buffer.from(base64Data, 'base64'), 50, 45, { width: 60 });
                } else {
                    doc.image(branding.logo, 50, 45, { width: 60 });
                }
            } catch (e) {
                console.error('Logo error:', e);
            }
        }

        doc.fillColor('#444444')
            .fontSize(20)
            .text(general.companyName || 'CRM Enterprise', 120, 50)
            .fontSize(10)
            .text(branding.address || '', 120, 75)
            .text(`${branding.contact?.email || ''}${branding.contact?.phone ? ' | ' + branding.contact.phone : ''}`, 120, 90)
            .moveDown();

        doc.rect(50, 120, 500, 1).fill('#CCCCCC');

        // Employee and Period Info
        doc.fontSize(12).fillColor('#333333').font('Helvetica-Bold')
            .text('PAYSLIP', 50, 140)
            .font('Helvetica')
            .fontSize(10)
            .text(`Month/Year: ${payroll.month}/${payroll.year}`, 400, 140);

        doc.moveDown();

        const dataGridY = 170;
        doc.text(`Employee Name: ${payroll.userId.name}`, 50, dataGridY);
        doc.text(`Employee ID: ${payroll.userId.employeeId || '-'}`, 300, dataGridY);

        doc.text(`Designation: ${payroll.userId.designation || '-'}`, 50, dataGridY + 15);
        doc.text(`Department: ${payroll.userId.department || '-'}`, 300, dataGridY + 15);

        doc.text(`Working Days: ${payroll.workingDays}`, 50, dataGridY + 30);
        doc.text(`Present Days: ${payroll.presentDays}`, 300, dataGridY + 30);

        // Earnings and Deductions Table
        const tableY = 230;
        doc.rect(50, tableY, 245, 20).fill('#F0F0F0');
        doc.rect(305, tableY, 245, 20).fill('#F0F0F0');

        doc.fillColor('#333333').font('Helvetica-Bold')
            .text('EARNINGS', 60, tableY + 6)
            .text('AMOUNT', 220, tableY + 6)
            .text('DEDUCTIONS', 315, tableY + 6)
            .text('AMOUNT', 475, tableY + 6);

        doc.font('Helvetica').fontSize(9);
        let currentY = tableY + 25;

        // Earnings
        const earnings = [
            { label: 'Basic Salary', value: payroll.salaryComponents.basic },
            { label: 'HRA', value: payroll.salaryComponents.hra },
            { label: 'Allowances', value: payroll.salaryComponents.allowances },
            { label: 'Incentives', value: payroll.salaryComponents.incentives || 0 }
        ];

        // Deductions
        const deductions = [
            { label: 'Provident Fund (PF)', value: payroll.deductions.pf },
            { label: 'ESI', value: payroll.deductions.esi },
            { label: 'TDS', value: payroll.deductions.tds || 0 },
            { label: 'Other Deductions', value: payroll.deductions.otherDeductions || 0 }
        ];

        const rowCount = Math.max(earnings.length, deductions.length);
        for (let i = 0; i < rowCount; i++) {
            if (earnings[i]) {
                doc.text(earnings[i].label, 60, currentY);
                doc.text(`₹${earnings[i].value.toLocaleString()}`, 220, currentY);
            }
            if (deductions[i]) {
                doc.text(deductions[i].label, 315, currentY);
                doc.text(`₹${deductions[i].value.toLocaleString()}`, 475, currentY);
            }
            currentY += 20;
        }

        doc.rect(50, currentY, 245, 1).fill('#EEEEEE');
        doc.rect(305, currentY, 245, 1).fill('#EEEEEE');
        currentY += 10;

        const totalEarningsValue = earnings.reduce((sum, e) => sum + e.value, 0);
        const totalDeductionsValue = deductions.reduce((sum, d) => sum + d.value, 0);

        doc.font('Helvetica-Bold');
        doc.text('Total Earnings', 60, currentY);
        doc.text(`₹${totalEarningsValue.toLocaleString()}`, 220, currentY);
        doc.text('Total Deductions', 315, currentY);
        doc.text(`₹${totalDeductionsValue.toLocaleString()}`, 475, currentY);

        // Net Pay Box
        currentY += 40;
        doc.rect(50, currentY, 500, 40).fill('#E8F5E9');
        doc.fillColor('#2E7D32').fontSize(12)
            .text('NET PAYABLE AMOUNT', 70, currentY + 15)
            .fontSize(14)
            .text(`INR ${payroll.netSalary.toLocaleString()}`, 380, currentY + 13);

        // Footer
        const footerY = 750;
        doc.rect(50, footerY - 10, 500, 1).fill('#CCCCCC');
        doc.fillColor('#666666').fontSize(8)
            .text(branding.footerText || 'This is a computer generated document and does not require a signature.', 50, footerY, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        console.error('PDF Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
};

exports.deletePayroll = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[PAYROLL] Deleting record: ${id}`);
        const payroll = await Payroll.findByIdAndDelete(id);
        if (!payroll) return res.status(404).json({ message: 'Payroll record not found' });
        res.json({ message: 'Payroll record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

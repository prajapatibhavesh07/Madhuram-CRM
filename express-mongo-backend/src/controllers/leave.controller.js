const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');

exports.applyLeave = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Authentication required" });
        const userId = req.user._id;
        const { type, startDate, endDate, reason } = req.body;

        if (!startDate || !endDate || !reason) {
            console.log('[LEAVE] Missing fields:', { startDate, endDate, reason });
            return res.status(400).json({ message: 'Please provide all required fields: startDate, endDate, reason' });
        }
        console.log(`[LEAVE] Appling ${type} for user ${userId}: ${startDate} to ${endDate}`);

        // Calculate days
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        const diffTime = Math.abs(end - start);
        const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

        // Check Balance
        const currentYear = new Date().getFullYear();
        let balance = await LeaveBalance.findOne({ userId, year: currentYear });

        if (!balance) {
            // Create default balance if not exists
            balance = new LeaveBalance({ userId, year: currentYear });
            await balance.save();
        }

        // Map type to balance key
        const typeMap = {
            'Casual Leave': 'casualLeave',
            'Sick Leave': 'sickLeave',
            'Earned Leave': 'earnedLeave',
            'Comp Off': 'compOff'
        };

        const balanceKey = typeMap[type];
        if (balanceKey) {
            const usedAmount = balance.used && balance.used[balanceKey] ? balance.used[balanceKey] : 0;
            const available = (balance[balanceKey] || 0) - usedAmount;
            if (available < daysCount) {
                return res.status(400).json({ message: `Insufficient ${type} balance. Available: ${available}` });
            }
        }

        const leave = new Leave({
            userId,
            type,
            startDate,
            endDate,
            daysCount,
            reason
        });

        await leave.save();
        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLeaves = async (req, res) => {
    try {
        const { status, userId } = req.query;
        const query = {};
        if (status) query.status = status;
        if (userId) query.userId = userId;

        // If not admin, force userId filter? Or let middleware handle it? 
        // Assuming Admin can see all, User sees theirs. Logic controlled by frontend/middleware context usually.
        // For My Leaves, we'll use a separate endpoint or filtering.

        const leaves = await Leave.find(query).populate('userId', 'name').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyLeaves = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const userId = req.user._id;
        const leaves = await Leave.find({ userId }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        if (!req.user) return res.status(401).json({ message: "Authentication required" });
        const approverId = req.user._id;

        const leave = await Leave.findById(id);
        if (!leave) return res.status(404).json({ message: 'Leave not found' });

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Leave already processed' });
        }

        leave.status = status;
        leave.approvedBy = approverId;
        if (status === 'Rejected') {
            leave.rejectionReason = rejectionReason;
        } else if (status === 'Approved') {
            // Deduct balance
            const currentYear = new Date().getFullYear();
            const balance = await LeaveBalance.findOne({ userId: leave.userId, year: currentYear });

            if (balance) {
                const typeMap = {
                    'Casual Leave': 'casualLeave',
                    'Sick Leave': 'sickLeave',
                    'Earned Leave': 'earnedLeave',
                    'Comp Off': 'compOff'
                };
                const balanceKey = typeMap[leave.type];
                if (balanceKey) {
                    if (!balance.used) {
                        balance.used = { casualLeave: 0, sickLeave: 0, earnedLeave: 0, compOff: 0 };
                    }
                    balance.used[balanceKey] = (balance.used[balanceKey] || 0) + leave.daysCount;
                    await balance.save();
                }
            }
        }

        await leave.save();
        res.json(leave);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBalance = async (req, res) => {
    try {
        const userId = req.query.userId || (req.user ? req.user._id : null);

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const currentYear = new Date().getFullYear();
        let balance = await LeaveBalance.findOne({ userId, year: currentYear });

        if (!balance) {
            balance = new LeaveBalance({ userId, year: currentYear });
            await balance.save();
        }
        res.json(balance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const leave = await Leave.findById(id);
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending leave requests can be deleted' });
        }

        await Leave.findByIdAndDelete(id);
        res.json({ message: 'Leave request deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cleanupOldPendingLeaves = async () => {
    try {
        const currentYear = new Date().getFullYear();
        // Delete all Pending leaves from previous years
        const result = await Leave.deleteMany({
            status: 'Pending',
            startDate: { $lt: new Date(currentYear, 0, 1) } 
        });
        if (result.deletedCount > 0) {
            console.log(`[CLEANUP] Deleted ${result.deletedCount} old pending leaves`);
        }
    } catch (error) {
        console.error('[CLEANUP] Error cleaning up leaves:', error.message);
    }
};

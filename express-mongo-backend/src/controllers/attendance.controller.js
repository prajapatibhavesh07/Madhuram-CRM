const Attendance = require('../models/Attendance');

exports.punchIn = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Authentication required" });
        const userId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({ userId, date: today });

        if (attendance) {
            return res.status(200).json({ message: 'Already punched in for today', alreadyPunched: true, attendance });
        }

        const now = new Date();
        let status = 'Present';

        try {
            const Settings = require('../models/Settings');
            const settings = await Settings.findOne();
            if (settings && settings.attendance && settings.attendance.halfDayThreshold) {
                const [thresholdHour, thresholdMin] = settings.attendance.halfDayThreshold.split(':').map(Number);
                const punchHour = now.getHours();
                const punchMin = now.getMinutes();

                if (punchHour > thresholdHour || (punchHour === thresholdHour && punchMin > thresholdMin)) {
                    status = 'Half Day';
                }
            }
        } catch (err) {
            console.error('Error applying attendance settings for half-day:', err);
        }

        attendance = new Attendance({
            userId,
            date: today,
            inTime: now,
            status
        });

        await attendance.save();
        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.punchOut = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Authentication required" });
        const userId = req.user._id;
        const attendance = await Attendance.findOne({ userId, outTime: { $exists: false } }).sort({ date: -1 });

        if (!attendance) {
            return res.status(404).json({ message: 'No active punch-in record found' });
        }

        const outTime = new Date();
        attendance.outTime = outTime;

        // Calculate total hours
        const diffMs = outTime - attendance.inTime;
        const diffHrs = diffMs / (1000 * 60 * 60);
        attendance.totalHours = parseFloat(diffHrs.toFixed(2));

        // Basic Overtime Logic (assuming 9 hour shift)
        if (attendance.totalHours > 9) {
            attendance.overtime = parseFloat((attendance.totalHours - 9).toFixed(2));
        }

        await attendance.save();
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllAttendance = async (req, res) => {
    try {
        const { date, month, year } = req.query;
        const query = {};

        if (date) {
            const queryDate = new Date(date);
            queryDate.setHours(0, 0, 0, 0);
            query.date = queryDate;
        } else if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const userId = req.query.userId || (req.user ? req.user._id : null);
        if (userId) query.userId = userId;

        const records = await Attendance.find(query)
            .populate('userId', 'name email employeeId role department')
            .sort({ date: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyAttendance = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const { month, year } = req.query;
        const userId = req.user._id;
        const query = { userId };

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const records = await Attendance.find(query).sort({ date: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[ATTENDANCE] Deleting record: ${id}`);
        const attendance = await Attendance.findByIdAndDelete(id);
        if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
        res.json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

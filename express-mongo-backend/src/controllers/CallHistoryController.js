const CallHistory = require("../models/CallHistory");
const User = require("../models/User");

const CallHistoryController = {
    getAll: async (req, res) => {
        try {
            const isAdmin = ['Super Admin', 'Admin'].includes(req.user.role);
            let filter = {};
            if (!isAdmin) {
                filter.createdBy = req.user._id;
            }

            const calls = await CallHistory.find(filter)
                .populate('createdBy', 'name role')
                .populate('linkedEmployeeId', 'name employeeId phone')
                .sort({ date: -1 });

            res.status(200).json(calls);
        } catch (error) {
            console.error("Fetch calls error:", error);
            res.status(500).json({ message: "Failed to fetch calls" });
        }
    },

    create: async (req, res) => {
        try {
            console.log("Creating call log with body:", req.body);
            const data = { ...req.body, createdBy: req.user._id };

            // Handle recording file if uploaded
            if (req.file) {
                data.recordingUrl = `/uploads/recordings/${req.file.filename}`;
            }

            // Ensure duration and date types are correct and handle empty strings
            if (data.duration === '' || data.duration === null || data.duration === undefined) {
                delete data.duration;
            } else {
                data.duration = parseInt(data.duration);
                if (isNaN(data.duration)) delete data.duration;
            }

            if (data.callStartTime) {
                data.callStartTime = new Date(data.callStartTime);
                if (isNaN(data.callStartTime.getTime())) delete data.callStartTime;
            }

            if (data.date) {
                data.date = new Date(data.date);
                if (isNaN(data.date.getTime())) data.date = new Date();
            }

            // Validate required fields
            if (!data.name || !data.phone) {
                return res.status(400).json({ message: "Name and Phone are required for call log" });
            }

            // Map frontend callType/callDirection if necessary and validate enum
            const validTypes = ['Incoming', 'Outgoing', 'Missed'];
            if (!data.callType || !validTypes.includes(data.callType)) {
                if (data.callDirection && data.callDirection.toLowerCase().includes('incoming')) {
                    data.callType = 'Incoming';
                } else if (data.callDirection && data.callDirection.toLowerCase().includes('outgoing')) {
                    data.callType = 'Outgoing';
                } else {
                    data.callType = 'Outgoing';
                }
            }

            // Linking logic
            const matchedUser = await User.findOne({
                $or: [
                    { name: data.name },
                    { phone: data.phone }
                ]
            }).select('_id');
            if (matchedUser) data.linkedEmployeeId = matchedUser._id;

            // Direct candidate link if provided
            if (req.body.candidateId && req.body.candidateId !== '') {
                data.candidateId = req.body.candidateId;
            }

            const call = new CallHistory(data);
            await call.save();
            console.log("Call log created successfully:", call._id);
            res.status(201).json(call);
        } catch (error) {
            console.error("Create call error detail:", error);
            res.status(500).json({ 
                message: "Failed to create call log", 
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
            });
        }
    },

    bulkCreate: async (req, res) => {
        try {
            const list = req.body.list; 
            if (!Array.isArray(list)) return res.status(400).json({ message: "Invalid list format" });

            const preparedData = await Promise.all(list.map(async (item) => {
                const data = { ...item, createdBy: req.user._id };
                
                // Ensure date is a valid Date object if provided as string
                if (data.date) {
                    data.date = new Date(data.date);
                    if (isNaN(data.date.getTime())) {
                        data.date = new Date(); // Fallback if invalid
                    }
                }

                if (data.name || data.phone) {
                    const matchedUser = await User.findOne({
                        $or: [
                            { name: data.name },
                            { phone: data.phone }
                        ]
                    });
                    if (matchedUser) data.linkedEmployeeId = matchedUser._id;
                }
                return data;
            }));

            await CallHistory.insertMany(preparedData, { ordered: false });
            res.status(201).json({ message: `Successfully imported ${list.length} calls` });
        } catch (error) {
            console.error("Bulk create call error:", error);
            // If it's a validation error from insertMany, it might have detailed errors per index
            res.status(500).json({ 
                message: "Bulk import failed", 
                error: error.message,
                details: error.writeErrors ? `${error.writeErrors.length} records failed validation.` : null
            });
        }
    },

    update: async (req, res) => {
        try {
            const call = await CallHistory.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.status(200).json(call);
        } catch (error) {
            res.status(500).json({ message: "Update failed" });
        }
    },

    delete: async (req, res) => {
        try {
            await CallHistory.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Delete failed" });
        }
    }
};

module.exports = CallHistoryController;

const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const Interview = require("../models/Interview");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Operation = require("../models/Operation");
const mongoose = require("mongoose");
const { getSubordinateIds } = require("../middleware/roleMiddleware");

exports.getStats = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const userId = req.user._id;
        const userRole = req.user.role;
        const isAdmin = ["Super Admin", "Admin"].includes(userRole);

        // Date ranges for stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        let startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        let endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        if (startDate) {
            startDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        // 1. BASE STATS (Counters)
        let candidateQuery = {};
        let jobQuery = {};
        let interviewQuery = {};
        let taskQuery = { assignedTo: userId };

        if (startDate && endDate) {
            candidateQuery.createdAt = { $gte: startDate, $lte: endDate };
            jobQuery.createdAt = { $gte: startDate, $lte: endDate };
            interviewQuery.date = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            candidateQuery.createdAt = { $gte: startDate };
            jobQuery.createdAt = { $gte: startDate };
            interviewQuery.date = { $gte: startDate };
        } else if (endDate) {
            candidateQuery.createdAt = { $lte: endDate };
            jobQuery.createdAt = { $lte: endDate };
            interviewQuery.date = { $lte: endDate };
        } else {
            interviewQuery.date = { $gte: startOfToday };
        }

        // Role-based data isolation
        if (userRole === "Normal User") {
            // "Normal User" is a Candidate in this context
            const candidateProfile = await Candidate.findOne({ email: req.user.email });
            
            if (candidateProfile) {
                const interviews = await Interview.find({ candidateId: candidateProfile._id }).sort({ date: -1 });
                return res.json({
                    role: "Candidate",
                    candidate: candidateProfile,
                    interviews: interviews,
                    attendance: null // Candidates don't have attendance stats like employees
                });
            } else {
                return res.json({
                    role: "Candidate",
                    candidate: null,
                    interviews: [],
                    message: "No candidate profile found for this user."
                });
            }
        }

        if (!isAdmin) {
            const subIds = await getSubordinateIds(userId);
            if (subIds && subIds.length > 0) {
                const allSubIds = [userId, ...subIds];
                
                candidateQuery.$or = [
                    { createdBy: { $in: allSubIds } },
                    { assignedOperationManager: { $in: allSubIds } }
                ];
                jobQuery.postedBy = { $in: allSubIds };
                interviewQuery.$or = [
                    { interviewerId: { $in: allSubIds } },
                    { createdBy: { $in: allSubIds } }
                ];
                taskQuery.assignedTo = { $in: allSubIds };
            } else {
                // Recruiter / HR / Others (no subordinates)
                // Find candidates assigned via tasks
                const assignedTasks = await mongoose.model('Task').find({ 
                    assignedTo: userId, 
                    candidate: { $exists: true, $ne: null } 
                }).select('candidate');
                const candidateIdsFromTasks = assignedTasks.map(t => t.candidate);

                const queryConditions = [
                    { createdBy: userId },
                    { assignedOperationManager: userId }
                ];

                if (candidateIdsFromTasks.length > 0) {
                    queryConditions.push({ _id: { $in: candidateIdsFromTasks } });
                }

                candidateQuery.$or = queryConditions;

                jobQuery.postedBy = userId;
                interviewQuery.$or = [
                    { interviewerId: userId },
                    { createdBy: userId }
                ];
                taskQuery.assignedTo = userId;
            }
        }

        let lifetimeCandidateQuery = { ...candidateQuery };
        delete lifetimeCandidateQuery.createdAt;

        let activeInterviewQuery = { ...interviewQuery };
        delete activeInterviewQuery.date;
        activeInterviewQuery.status = { $in: ['Scheduled', 'Pending'] };

        const [
            totalCandidateLeads, 
            activeVacanciesResult, 
            scheduledInterviewsCount, 
            totalCandidateUsers, 
            pendingLeadsCount,
            shortlistedCount,
            interviewedCount,
            joinedCount
        ] = await Promise.all([
            Candidate.countDocuments(lifetimeCandidateQuery),
            Job.aggregate([
                { $match: { ...jobQuery, status: "Open" } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $convert: {
                                    input: "$openPosition",
                                    to: "int",
                                    onError: 0,
                                    onNull: 0
                                }
                            }
                        }
                    }
                }
            ]),
            Interview.countDocuments(activeInterviewQuery),
            User.countDocuments({ role: "Normal User", status: "Active" }),
            Candidate.countDocuments({ ...lifetimeCandidateQuery, status: 0 }),
            Candidate.countDocuments({ ...lifetimeCandidateQuery, recruitmentStatus: 'Shortlisted' }),
            Candidate.countDocuments({ ...lifetimeCandidateQuery, recruitmentStatus: 'Interviewed' }),
            Candidate.countDocuments({ ...lifetimeCandidateQuery, recruitmentStatus: 'Joined' })
        ]);

        const activeVacancies = activeVacanciesResult[0]?.total || 0;

        // 2. Attendance Percent (Dynamic Range)
        let attendanceQuery = {};
        if (startDate && endDate) {
            attendanceQuery.date = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            attendanceQuery.date = { $gte: startDate };
        } else if (endDate) {
            attendanceQuery.date = { $lte: endDate };
        } else {
            attendanceQuery.date = { $gte: startOfMonth };
        }

        if (!isAdmin) {
            attendanceQuery.userId = userId;
        }

        const attendanceRecords = await Attendance.find(attendanceQuery);
        let presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
        
        let workingDaysSoFar = 0;
        let d = new Date(startDate || startOfMonth);
        const limitDate = endDate && endDate < now ? endDate : now;
        while (d <= limitDate) {
            if (d.getDay() !== 0) workingDaysSoFar++;
            d.setDate(d.getDate() + 1);
        }

        let totalPossibleDays = workingDaysSoFar;
        if (isAdmin) {
            const activeUserCount = await User.countDocuments({ status: "Active" });
            totalPossibleDays = workingDaysSoFar * activeUserCount;
        }

        const attendancePercent = totalPossibleDays > 0 
            ? Math.round((presentCount / totalPossibleDays) * 100) 
            : 0;

        // 3. Operations Stats (For Admin or roles with Operations view permission)
        let operationsStats = null;
        const hasOperationsView = req.userPermissions && req.userPermissions.operations && req.userPermissions.operations.view;
        if (isAdmin || hasOperationsView) {
            const [readyToMove, vehicleAvailable, verified, poachWarning] = await Promise.all([
                Operation.countDocuments({ readyToMove: 'Yes' }),
                Operation.countDocuments({ vehicle: 'Yes' }),
                Operation.countDocuments({ verify: 'Yes' }),
                Operation.countDocuments({ noPoachInCV: 'Yes' })
            ]);
            operationsStats = { readyToMove, vehicleAvailable, verified, poachWarning };
        }

        // Recent Candidates
        const recentCandidates = await Candidate.find(lifetimeCandidateQuery)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('createdBy', 'name');

        // 4. Employee Productivity Stats (Role-Based Team Pulse)
        let employeeStats = [];
        let matchStage = {
            role: { $nin: ['Normal User', 'Super Admin'] },
            status: 'Active'
        };

        if (!isAdmin) {
            const subIds = await getSubordinateIds(userId);
            matchStage = {
                _id: { $in: [userId, ...subIds] },
                status: 'Active'
            };
        }

        employeeStats = await User.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'candidates',
                    localField: '_id',
                    foreignField: 'createdBy',
                    as: 'candidates'
                }
            },
            {
                $lookup: {
                    from: 'tasks',
                    localField: '_id',
                    foreignField: 'assignedTo',
                    as: 'tasks'
                }
            },
            {
                $project: {
                    name: 1,
                    role: 1,
                    phone: 1,
                    profilePhoto: 1,
                    candidateCount: { $size: '$candidates' },
                    taskCounts: {
                        $arrayToObject: {
                            $map: {
                                input: ['Todo', 'In Progress', 'Completed', 'Cancelled'],
                                as: 'status',
                                in: {
                                    k: '$$status',
                                    v: {
                                        $size: {
                                            $filter: {
                                                input: '$tasks',
                                                cond: { $eq: ['$$this.status', '$$status'] }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            { $sort: { candidateCount: -1 } }
        ]);

        // --- NEW DASHBOARD LISTS ---

        // 1. Pending or Expired Ticket List (Sorted DESC by updatedAt)
        const todayStr = now.toISOString().split('T')[0];
        const pendingTickets = await Candidate.find({
            $and: [
                lifetimeCandidateQuery,
                {
                    $or: [
                        {
                            tickets: {
                                $elemMatch: {
                                    portalStatus: { $ne: 'Completed' },
                                    ticketNo: { $in: [null, ""] },
                                    $or: [
                                        { portalStatus: 'Pending' },
                                        { expdate: { $lt: todayStr } }
                                    ]
                                }
                            }
                        },
                        { tickets: { $size: 0 } },
                        { tickets: { $exists: false } },
                        { tickets: null }
                    ]
                }
            ]
        })
        .select('name tickets applicationId phone updatedAt companyMulti dateFiled')
        .sort({ updatedAt: -1 });

        // 2. Current Day & Overdue Reminders List (Sorted DESC by reminderTime)
        let reminderFilter = {
            ...taskQuery,
            status: { $ne: 'Completed' }
        };
        if (startDate && endDate) {
            reminderFilter.reminderTime = { $gte: startDate, $lte: endDate };
        } else {
            reminderFilter.reminderTime = { $lte: endOfToday };
        }

        const reminders = await mongoose.model('Task').find(reminderFilter)
            .sort({ reminderTime: -1 }).populate('candidate', 'name phone applicationId');

        // 3. Assessment Pending List (Current Day only, sorted DESC by updatedAt)
        const assessmentPending = await Candidate.find({
            ...lifetimeCandidateQuery,
            assessment: 'Pending',
            $or: [
                { createdAt: { $gte: startOfToday, $lte: endOfToday } },
                { updatedAt: { $gte: startOfToday, $lte: endOfToday } }
            ]
        })
        .select('name applicationId phone location createdAt updatedAt')
        .sort({ updatedAt: -1 });

        // 4. New Assigned Candidate List (Current Day only, sorted DESC by createdAt)
        const newAssigned = await Candidate.find({
            ...lifetimeCandidateQuery,
            $or: [
                { createdAt: { $gte: startOfToday, $lte: endOfToday } },
                { updatedAt: { $gte: startOfToday, $lte: endOfToday } }
            ]
        })
        .select('name applicationId phone createdAt updatedAt')
        .sort({ createdAt: -1 });

        res.json({
            role: userRole,
            counters: {
                totalCandidates: totalCandidateLeads,
                totalCandidateLeads: totalCandidateLeads, 
                activeVacancies,
                interviewsToday: scheduledInterviewsCount,
                totalCandidateUsers,
                pendingLeads: pendingLeadsCount,
                activeInterviews: scheduledInterviewsCount,
                newAssignedCount: newAssigned.length,
                pendingTicketsCount: pendingTickets.length,
                remindersCount: reminders.length,
                assessmentPendingCount: assessmentPending.length,
                shortlistedCount: shortlistedCount,
                interviewedCount: interviewedCount,
                joinedCount: joinedCount
            },
            attendance: {
                present: attendancePercent,
                absent: 100 - attendancePercent
            },
            operations: operationsStats,
            recentCandidates,
            employeeStats,
            // New Lists
            pendingTickets,
            reminders,
            assessmentPending,
            newAssigned
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ error: error.message });
    }
};

const Interview = require('../models/Interview');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const Candidate = require('../models/Candidate');
const { getSubordinateIds } = require('../middleware/roleMiddleware');

exports.scheduleInterview = async (req, res) => {
    try {
        const interview = new Interview({ ...req.body, createdBy: req.user?._id });
        await interview.save();

        await auditService.logAction(req, {
            action: 'CREATE',
            module: 'Interview',
            targetId: interview._id,
            targetModel: 'Interview',
            details: interview.candidateId 
                ? `Interview scheduled for candidate ID: ${interview.candidateId}`
                : `Calendar event scheduled: ${interview.title || 'Event'}`
        });

        // Notifications
        const dateStr = new Date(interview.date).toLocaleString();
        
        // 1. Notify Interviewer (User)
        if (interview.interviewerId) {
            await notificationService.sendNotification(interview.interviewerId, {
                title: 'New Interview Scheduled',
                message: `You have an interview scheduled for ${dateStr}.`,
                type: 'interview',
                path: '/interviews',
                channels: ['in-app', 'email']
            });
        }

        // 2. Notify Candidate (SMS/WhatsApp - simulating multi-channel)
        if (interview.candidateId) {
            const candidate = await Candidate.findById(interview.candidateId);
            if (candidate) {
                if (candidate.phone) {
                    const twilioService = require('../services/twilioService');
                    await twilioService.sendWhatsApp(candidate.whatsapp || candidate.phone, 
                        `Hi ${candidate.name}, your interview has been scheduled for ${dateStr}. Please be prepared!`);
                }
            }
        }

        res.status(201).json(interview);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getInterviews = async (req, res) => {
    try {
        const filters = {};
        if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
            const subordinateIds = await getSubordinateIds(req.user._id);
            const allowedUserIds = [req.user._id, ...subordinateIds];
            filters.$or = [
                { interviewerId: { $in: allowedUserIds } },
                { createdBy: { $in: allowedUserIds } }
            ];
        }
        
        if (req.query.candidateId) filters.candidateId = req.query.candidateId;
        if (req.query.interviewerId) filters.interviewerId = req.query.interviewerId;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.date) {
            const date = new Date(req.query.date);
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);
            filters.date = { $gte: date, $lt: nextDate };
        }

        const interviews = await Interview.find(filters)
            .populate('candidateId', 'name email gender phone designation resume photograph panCard aadhaarCard educationProof offerLetter relativeLetter offerStatus isResigned resignationLetter doj noticePeriod')
            .populate('jobId', 'title company')
            .populate('interviewerId', 'name email')
            .populate('createdBy', 'name email')
            .sort({ date: 1 });
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getInterviewById = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate('candidateId', 'name email gender phone designation resume photograph panCard aadhaarCard educationProof offerLetter relativeLetter offerStatus isResigned resignationLetter doj noticePeriod')
            .populate('jobId', 'title company')
            .populate('interviewerId', 'name email')
            .populate('createdBy', 'name email');
        if (!interview) return res.status(404).json({ message: 'Interview not found' });
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateInterview = async (req, res) => {
    try {
        const oldInterview = await Interview.findById(req.params.id);
        if (!oldInterview) return res.status(404).json({ message: 'Interview not found' });

        // Role-base check
        if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
            const subordinateIds = await getSubordinateIds(req.user._id);
            const allowedUserIds = [req.user._id.toString(), ...subordinateIds.map(id => id.toString())];

            const isCreatorOrSubordinate = oldInterview.createdBy && allowedUserIds.includes(oldInterview.createdBy.toString());
            const isInterviewerOrSubordinate = oldInterview.interviewerId && allowedUserIds.includes(oldInterview.interviewerId.toString());

            if (!isCreatorOrSubordinate && !isInterviewerOrSubordinate) {
                return res.status(403).json({ message: "Access denied: You can only update interviews scheduled by or for you or your subordinates." });
            }
        }

        const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true });

        const changes = auditService.detectChanges(oldInterview, interview);
        if (changes) {
            const isStatusChange = !!changes.status;
            await auditService.logAction(req, {
                action: isStatusChange ? 'STATUS_CHANGE' : 'UPDATE',
                module: 'Interview',
                targetId: interview._id,
                targetModel: 'Interview',
                changes,
                details: isStatusChange ? `Interview status changed to ${changes.status.new}` : `Interview updated`
            });
        }

        res.json(interview);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteInterview = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);
        if (!interview) return res.status(404).json({ message: 'Interview not found' });

        // Role-base check
        if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
            const subordinateIds = await getSubordinateIds(req.user._id);
            const allowedUserIds = [req.user._id.toString(), ...subordinateIds.map(id => id.toString())];

            const isCreatorOrSubordinate = interview.createdBy && allowedUserIds.includes(interview.createdBy.toString());
            if (!isCreatorOrSubordinate) {
                return res.status(403).json({ message: "Access denied: You can only cancel interviews scheduled by you or your subordinates." });
            }
        }

        await Interview.findByIdAndDelete(req.params.id);
        if (interview) {
            await auditService.logAction(req, {
                action: 'DELETE',
                module: 'Interview',
                targetId: interview._id,
                targetModel: 'Interview',
                details: `Interview cancelled/deleted`
            });
        }
        res.json({ message: 'Interview cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

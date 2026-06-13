const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
const Counter = require("../models/Counter");
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const emailService = require("../services/emailService");
const auditService = require("../services/auditService");
const Folder = require("../models/Folder");
const File = require("../models/File");
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { getSubordinateIds } = require('../middleware/roleMiddleware');

const getOrCreateCandidateFolder = async (candidate, userId) => {
    try {
        const folderName = `Candidate: ${candidate.name} (${candidate.applicationId})`;
        let folder = await Folder.findOne({ name: folderName, isDeleted: false });
        if (!folder) {
            folder = new Folder({
                name: folderName,
                createdBy: userId || candidate.createdBy // Fallback to candidate owner if userId is missing
            });
            await folder.save();
        }
        return folder;
    } catch (error) {
        console.error("Error in getOrCreateCandidateFolder:", error);
        return null;
    }
};
const resumeParserService = require("../services/resumeParserService");
const automationService = require("../services/automationService");

// Create Candidate
exports.createCandidate = async (req, res) => {
    try {
        console.log("[CANDIDATE_CONTROLLER] createCandidate initiated");
        let candidateData = req.body;

        if (!candidateData) {
            console.error("[CANDIDATE_CONTROLLER] Request body is missing");
            return res.status(400).json({
                error: "Request body is missing. This usually happens if the multipart/form-data parser (multer) is not configured correctly."
            });
        }

        // Deep copy to avoid mutating req.body if needed, but here we just need a clean object
        candidateData = { ...candidateData };

        // Set createdBy to current user if not already set
        if (!candidateData.createdBy && req.user?._id) {
            candidateData.createdBy = req.user._id;
        }

        const { email, phone } = candidateData;

        // Check for duplicate email
        if (email && email.trim() !== "") {
            const existingEmail = await Candidate.findOne({ email: email.trim() });
            if (existingEmail) {
                return res.status(400).json({ error: "A candidate with this email address already exists." });
            }
        } else if (email === "") {
            delete candidateData.email; // Don't save empty string if unique index is on field
        }

        // Check for duplicate phone
        if (phone && phone.trim() !== "") {
            const existingPhone = await Candidate.findOne({ phone: phone.trim() });
            if (existingPhone) {
                return res.status(400).json({ error: "A candidate with this phone number already exists." });
            }
        } else if (phone === "") {
            delete candidateData.phone; // Don't save empty string
        }

        // Parse JSON fields from FormData strings
        const jsonFields = ['tickets', 'extractedExperience', 'extractedEducation', 'fulfillmentChecklist', 'companyMulti'];
        jsonFields.forEach(field => {
            if (typeof candidateData[field] === 'string') {
                try {
                    candidateData[field] = JSON.parse(candidateData[field]);
                } catch (e) {
                    console.error(`[CANDIDATE_CONTROLLER] Error parsing ${field}:`, e.message);
                    candidateData[field] = []; // Fallback to empty array
                }
            }
        });

        // Filter out completely empty tickets
        if (Array.isArray(candidateData.tickets)) {
            candidateData.tickets = candidateData.tickets.filter(t => t && (t.ticketNo?.trim() || t.companyName?.trim()));
        }

        // Handle empty jobId which comes as string "null" or "" from FormData
        if (candidateData.jobId === "" || candidateData.jobId === "null" || candidateData.jobId === "undefined") {
            candidateData.jobId = null;
        }

        // --- Robust Data Casting for Numbers and Dates ---
        const numberFields = ['age', 'currentCTC', 'expectedCTC', 'totalWorkExp', 'totalSalesExp', 'bfsiExp', 'aiScore'];
        numberFields.forEach(field => {
            if (candidateData[field] === "" || candidateData[field] === "null" || candidateData[field] === undefined) {
                candidateData[field] = undefined;
            } else if (typeof candidateData[field] === 'string') {
                const val = parseFloat(candidateData[field]);
                candidateData[field] = isNaN(val) ? undefined : val;
            }
        });

        const dateFields = ['dob', 'doj', 'approvedAt'];
        dateFields.forEach(field => {
            if (candidateData[field] === "" || candidateData[field] === "null" || candidateData[field] === undefined) {
                candidateData[field] = undefined;
            } else {
                const date = new Date(candidateData[field]);
                candidateData[field] = isNaN(date.getTime()) ? undefined : date;
            }
        });

        const booleanFields = ['willingToRelocate', 'isApproved'];
        booleanFields.forEach(field => {
            if (typeof candidateData[field] === 'string') {
                candidateData[field] = candidateData[field] === 'true';
            }
        });

        // Clean up pan to uppercase
        if (candidateData.pan) candidateData.pan = candidateData.pan.toUpperCase();

        // Generate Application ID if not provided
        if (!candidateData.applicationId) {
            try {
                const counter = await Counter.findOneAndUpdate(
                    { id: "candidates" },
                    { $inc: { seq: 1 } },
                    { new: true, upsert: true }
                );
                candidateData.applicationId = `APP${counter.seq.toString().padStart(3, '0')}`;
            } catch (counterErr) {
                console.error("[CANDIDATE_CONTROLLER] Counter update failed:", counterErr.message);
                // Fallback ID if counter fails
                candidateData.applicationId = `APP${Date.now().toString().slice(-6)}`;
            }
        }

        const candidate = new Candidate(candidateData);
        await candidate.save();

        // Handle Multiple Files and Folder creation
        if (req.files) {
            console.log("[CANDIDATE_CONTROLLER] Processing uploaded files:", Object.keys(req.files));
            const folder = await getOrCreateCandidateFolder(candidate, req.user?._id);
            if (folder) {
                const fileFields = ['resume', 'photograph', 'panCard', 'aadhaarCard', 'educationProof', 'offerLetter', 'relativeLetter', 'resignationLetter', 'salarySlip', 'cheque', 'signature'];
                let candidateUpdated = false;

                for (const field of fileFields) {
                    if (req.files[field] && req.files[field][0]) {
                        const uploadedFile = req.files[field][0];
                        const fileUrl = `/uploads/resumes/${uploadedFile.filename}`;
                        
                        try {
                            // Create File document in the candidate's folder
                            const fileDoc = new File({
                                name: `${field.charAt(0).toUpperCase() + field.slice(1)} - ${candidate.name}`,
                                folder: folder._id,
                                tags: ['Candidate Document', field],
                                createdBy: req.user?._id || candidate.createdBy,
                                versions: [{
                                    versionNumber: 1,
                                    fileUrl,
                                    note: `Initial upload for ${field}`,
                                    uploadedBy: req.user?._id || candidate.createdBy
                                }]
                            });
                            await fileDoc.save();

                            // Update candidate document with the link
                            candidate[field] = {
                                fileName: uploadedFile.originalname,
                                fileUrl: fileUrl,
                                ...(field === 'resume' ? { fileSize: uploadedFile.size, mimeType: uploadedFile.mimetype } : {})
                            };
                            candidateUpdated = true;
                        } catch (fileErr) {
                            console.error(`[CANDIDATE_CONTROLLER] Error saving File record for ${field}:`, fileErr.message);
                        }
                    }
                }
                
                if (candidateUpdated) {
                    await candidate.save();
                }
            }
        }

        // AI: Trigger Auto-Reply (Async, don't await to speed up response if it's slow)
        automationService.autoReplyToCandidate(candidate).catch(err => {
            console.error("[CANDIDATE_CONTROLLER] Auto-reply failed:", err.message);
        });

        // AI: Trigger Scoring (Async)
        if (candidate.jobId) {
            const scoringService = require('../services/scoringService');
            scoringService.scoreCandidateForJob(candidate._id, candidate.jobId).catch(err => {
                console.error("[CANDIDATE_CONTROLLER] Auto-scoring failed:", err.message);
            });
        }

        // Audit Log (Async)
        auditService.logAction(req, {
            action: 'CREATE',
            module: 'Candidate',
            targetId: candidate._id,
            targetModel: 'Candidate',
            details: `Candidate "${candidate.name}" created`
        }).catch(err => console.error("[CANDIDATE_CONTROLLER] Audit log failed:", err.message));

        // Trigger In-App Notifications (Async)
        User.find({ role: { $in: ['Super Admin', 'Admin', 'Manager', 'Recruiter'] } })
            .then(admins => {
                const notificationPromises = admins.map(admin => 
                    notificationService.sendNotification(admin._id, {
                        title: 'New Candidate Applied',
                        message: `${candidate.name} has applied for ${candidate.currentProfile || 'a position'}.`,
                        type: 'info',
                        path: `/candidates?id=${candidate._id}`,
                        channels: ['in-app']
                    })
                );
                return Promise.all(notificationPromises);
            })
            .catch(notifErr => {
                console.error('[NOTIF] Failed to broadcast candidate notification:', notifErr.message);
            });

        console.log("[CANDIDATE_CONTROLLER] Candidate created successfully:", candidate.applicationId);
        res.status(201).json(candidate);
    } catch (error) {
        console.error("[CANDIDATE_CONTROLLER] Create candidate error:", error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: `Validation Error: ${messages.join(', ')}` });
        }
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ error: `A candidate with this ${field} already exists.` });
        }

        res.status(500).json({ 
            error: error.message || "Internal Server Error",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
    }
};

// Check Duplicate
exports.checkDuplicate = async (req, res) => {
    try {
        const { field, value } = req.body;
        if (!field || !value) {
            return res.status(400).json({ error: "Field and value are required" });
        }

        const query = { [field]: value };
        const duplicate = await Candidate.findOne(query);

        if (duplicate) {
            // Find all Admins and Managers to notify
            const adminsAndManagers = await User.find({ 
                role: { $in: ["Super Admin", "Admin", "Manager"] },
                status: "Active"
            });

            const sender = req.user?._id;
            const senderName = req.user?.name || "A user";

            // Create notification and tasks for each
            const workPromises = adminsAndManagers.map(async (user) => {
                // Create Notification
                const newNotification = new Notification({
                    recipient: user._id,
                    sender: sender,
                    title: "Duplicate Candidate Entry Attempt",
                    message: `${senderName} attempted to enter a duplicate ${field}: ${value}. Existing candidate: ${duplicate.name} (${duplicate.applicationId})`,
                    type: "warning",
                    path: `/candidates/edit/${duplicate._id}`
                });
                
                // Create Task
                const newTask = new Task({
                    title: `Investigate Duplicate Alert: ${duplicate.name}`,
                    description: `${senderName} flagged a possible duplicate for ${field}: ${value}. Please review candidate details and take action.`,
                    assignedTo: user._id,
                    candidate: duplicate._id,
                    priority: 'High',
                    status: 'Todo',
                    createdBy: sender || adminsAndManagers[0]._id // Fallback to first admin if sender missing
                });

                return Promise.all([newNotification.save(), newTask.save()]);
            });

            await Promise.all(workPromises);

            return res.json({ 
                isDuplicate: true, 
                candidate: {
                    _id: duplicate._id,
                    name: duplicate.name,
                    applicationId: duplicate.applicationId
                }
            });
        }

        res.json({ isDuplicate: false });
    } catch (error) {
        console.error("Check duplicate error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get Candidates
exports.getCandidates = async (req, res) => {
    try {
        const { isApproved, searchTerm, limit, showAll } = req.query;
        const query = {};

        // Role-based filtering
        if (!req.user) return res.status(401).json({ message: "Authentication required" });
        const { role, _id } = req.user;

        if (role !== 'Admin' && role !== 'Super Admin' && showAll !== 'true') {
            // Find candidates assigned via tasks
            const assignedTasks = await Task.find({ assignedTo: _id, candidate: { $exists: true, $ne: null } }).select('candidate');
            const candidateIdsFromTasks = assignedTasks.map(t => t.candidate);

            // Get subordinates
            const subordinateIds = await getSubordinateIds(_id);
            const allowedUserIds = [_id, ...subordinateIds];

            // Non-admin users can see:
            // 1. Candidates they or their subordinates created (createdBy in allowedUserIds)
            // 2. Candidates assigned to them via tasks
            // 3. Candidates assigned to them as Operation Manager
            const queryConditions = [
                { createdBy: { $in: allowedUserIds } },
                { assignedOperationManager: _id }
            ];

            if (candidateIdsFromTasks.length > 0) {
                queryConditions.push({ _id: { $in: candidateIdsFromTasks } });
            }

            query.$or = queryConditions;
        }

        if (isApproved !== undefined) {
            if (isApproved === 'true') {
                query.isApproved = { $ne: false };
            } else {
                query.isApproved = false;
            }
        }

        if (searchTerm) {
            // Add search filter
            const searchConditions = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { phone: { $regex: searchTerm, $options: 'i' } },
                { applicationId: { $regex: searchTerm, $options: 'i' } }
            ];
            
            if (query.$or) {
                // Combine existing $or with search
                query.$and = [
                    { $or: query.$or },
                    { $or: searchConditions }
                ];
                delete query.createdBy;
            } else if (query.createdBy) {
                query.$and = [
                    { createdBy: query.createdBy },
                    { $or: searchConditions }
                ];
                delete query.createdBy;
            } else {
                query.$or = searchConditions;
            }
        }

        let mongoQuery = Candidate.find(query)
            .populate('createdBy', 'name')
            .populate('approvedBy', 'name')
            .populate('assignedOperationManager', 'name')
            .sort({ createdAt: -1 });

        if (limit) {
            mongoQuery = mongoQuery.limit(parseInt(limit));
        }

        const candidates = await mongoQuery;
        
        // Wrap in object if limit is provided to match frontend expectations for search
        if (searchTerm || limit) {
            res.json({ candidates });
        } else {
            res.json(candidates);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Approve Candidate
exports.approveCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            {
                isApproved: true,
                approvedBy: req.user._id,
                approvedAt: new Date()
            },
            { new: true }
        );

        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        await auditService.logAction(req, {
            action: 'UPDATE',
            module: 'Candidate',
            targetId: candidate._id,
            targetModel: 'Candidate',
            details: `Candidate "${candidate.name}" approved`
        });

        res.json(candidate);
    } catch (error) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ error: "Invalid Candidate ID format." });
        }
        res.status(500).json({ error: error.message });
    }
};

// Get Candidate by ID
exports.getCandidateById = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('approvedBy', 'name')
            .populate('assignedOperationManager', 'name');
        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        // Role-base check - non-admins can view candidates they or their subordinates created OR assigned to them via tasks or operations
        if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
            const subordinateIds = await getSubordinateIds(req.user._id);
            const allowedUserIds = [req.user._id.toString(), ...subordinateIds.map(id => id.toString())];

            const createdById = candidate.createdBy ? (candidate.createdBy._id || candidate.createdBy).toString() : null;
            const isCreatorOrSubordinate = createdById && allowedUserIds.includes(createdById);
            const hasTask = await Task.exists({ assignedTo: req.user._id, candidate: candidate._id });
            const isAssignedOpManager = candidate.assignedOperationManager && 
                (candidate.assignedOperationManager._id || candidate.assignedOperationManager).toString() === req.user._id.toString();
            
            if (!isCreatorOrSubordinate && !hasTask && !isAssignedOpManager) {
                return res.status(403).json({ message: "Access denied: You can only view candidates you or your subordinates created, those assigned to you, or those you are managing." });
            }
        }

        res.json(candidate);
    } catch (error) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ error: "Invalid Candidate ID format." });
        }
        res.status(500).json({ error: error.message });
    }
};
// Update Candidate
exports.updateCandidate = async (req, res) => {
    try {
        const candidateData = req.body;
        console.log("Updating candidate ID:", req.params.id);
        console.log("Candidate data:", JSON.stringify(candidateData));

        const currentCandidate = await Candidate.findById(req.params.id);
        if (!currentCandidate) return res.status(404).json({ message: "Candidate not found" });

        // Role-base check - non-admins can update candidates they or their subordinates created OR assigned to them via tasks or operations
        if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
            const subordinateIds = await getSubordinateIds(req.user._id);
            const allowedUserIds = [req.user._id.toString(), ...subordinateIds.map(id => id.toString())];

            const createdById = currentCandidate.createdBy ? (currentCandidate.createdBy._id || currentCandidate.createdBy).toString() : null;
            const isCreatorOrSubordinate = createdById && allowedUserIds.includes(createdById);
            const hasTask = await Task.exists({ assignedTo: req.user._id, candidate: currentCandidate._id });
            const isAssignedOpManager = currentCandidate.assignedOperationManager && 
                (currentCandidate.assignedOperationManager._id || currentCandidate.assignedOperationManager).toString() === req.user._id.toString();

            if (!isCreatorOrSubordinate && !hasTask && !isAssignedOpManager) {
                return res.status(403).json({ message: "Access denied: You can only update candidates you or your subordinates created, those assigned to you, or those you are managing." });
            }
        }

        // Parse JSON fields from FormData strings
        const jsonFields = ['tickets', 'extractedExperience', 'extractedEducation', 'fulfillmentChecklist', 'companyMulti'];
        jsonFields.forEach(field => {
            if (typeof candidateData[field] === 'string') {
                try {
                    candidateData[field] = JSON.parse(candidateData[field]);
                } catch (e) {
                    console.error(`Error parsing ${field}:`, e);
                }
            }
        });

        // Filter out completely empty tickets
        if (Array.isArray(candidateData.tickets)) {
            candidateData.tickets = candidateData.tickets.filter(t => t.ticketNo?.trim() || t.companyName?.trim());
        }

        // Handle empty jobId which comes as string "null" or "" from FormData
        if (candidateData.jobId === "" || candidateData.jobId === "null") {
            candidateData.jobId = null;
        }

        const candidateId = req.params.id;
        const { email, phone } = candidateData;

        // Check for duplicate email
        if (email) {
            const existingEmail = await Candidate.findOne({ email, _id: { $ne: candidateId } });
            if (existingEmail) {
                return res.status(400).json({ error: "A candidate with this email address already exists." });
            }
        }

        // Check for duplicate phone
        if (phone) {
            const existingPhone = await Candidate.findOne({ phone, _id: { $ne: candidateId } });
            if (existingPhone) {
                return res.status(400).json({ error: "A candidate with this phone number already exists." });
            }
        }

        // Handle Multiple Files if updated
        if (req.files) {
            const folder = await getOrCreateCandidateFolder(currentCandidate, req.user?._id);
            if (folder) {
                const fileFields = ['resume', 'photograph', 'panCard', 'aadhaarCard', 'educationProof', 'offerLetter', 'relativeLetter', 'resignationLetter', 'salarySlip', 'cheque', 'signature'];
                for (const field of fileFields) {
                    if (req.files[field] && req.files[field][0]) {
                        const uploadedFile = req.files[field][0];
                        const fileUrl = `/uploads/resumes/${uploadedFile.filename}`;
                        const fileName = `${field.charAt(0).toUpperCase() + field.slice(1)} - ${currentCandidate.name}`;

                        try {
                            // Check if file already exists in this folder
                            let fileDoc = await File.findOne({ folder: folder._id, name: fileName, isDeleted: false });

                            if (fileDoc) {
                                // Upload new version
                                const newVersionNumber = fileDoc.currentVersion + 1;
                                fileDoc.versions.push({
                                    versionNumber: newVersionNumber,
                                    fileUrl,
                                    note: `Updated via candidate form`,
                                    uploadedBy: req.user?._id || currentCandidate.createdBy
                                });
                                fileDoc.currentVersion = newVersionNumber;
                                await fileDoc.save();
                            } else {
                                // Create new File document
                                fileDoc = new File({
                                    name: fileName,
                                    folder: folder._id,
                                    tags: ['Candidate Document', field],
                                    createdBy: req.user?._id || currentCandidate.createdBy,
                                    versions: [{
                                        versionNumber: 1,
                                        fileUrl,
                                        note: `Initial upload via update`,
                                        uploadedBy: req.user?._id || currentCandidate.createdBy
                                    }]
                                });
                                await fileDoc.save();
                            }
                        } catch (fileErr) {
                            console.error(`Error saving File record during update for ${field}:`, fileErr);
                        }

                        // Update candidateData with latest link
                        candidateData[field] = {
                            fileName: uploadedFile.originalname,
                            fileUrl: fileUrl,
                            ...(field === 'resume' ? { fileSize: uploadedFile.size, mimeType: uploadedFile.mimetype } : {})
                        };
                    }
                }
            }
        }

        const isRecruiterSwitched = candidateData.createdBy && 
                                   candidateData.createdBy.toString() !== currentCandidate.createdBy?.toString();

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            candidateData,
            { new: true, runValidators: false }
        );

        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        // Send notification to all connected users if tickets are updated
        if (candidateData.tickets) {
            User.find({ 
                role: { $in: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter'] },
                status: 'Active',
                _id: { $ne: req.user._id }
            }).then(activeUsers => {
                activeUsers.forEach(activeUser => {
                    notificationService.sendNotification(activeUser._id, {
                        title: 'Tickets Updated',
                        message: `${req.user.name} updated tickets for candidate: ${candidate.name}`,
                        type: 'info',
                        path: `/candidates?id=${candidate._id}`,
                        channels: ['in-app']
                    }).catch(e => console.error("Error sending ticket update notification:", e));
                });
            }).catch(err => console.error("Error finding users for ticket update notification:", err));

            // Send specific notification to the recruiter (createdBy) if updated by a Manager or Operation Manager
            if (['Manager', 'Operation Manager'].includes(req.user.role)) {
                const recruiterId = candidate.createdBy;
                if (recruiterId && recruiterId.toString() !== req.user._id.toString()) {
                    notificationService.sendNotification(recruiterId, {
                        title: 'Ticket Submitted by Manager',
                        message: `${req.user.name} (${req.user.role}) has submitted ticket data for your candidate: ${candidate.name}`,
                        type: 'info',
                        path: `/candidates?id=${candidate._id}`,
                        channels: ['in-app']
                    }).catch(e => console.error("Error sending recruiter ticket notification:", e));
                }
            }
        }

        // AI: Trigger Scoring (Async)
        if (candidate.jobId) {
            const scoringService = require('../services/scoringService');
            scoringService.scoreCandidateForJob(candidate._id, candidate.jobId).catch(err => {
                console.error("[CANDIDATE_CONTROLLER] Auto-scoring on update failed:", err.message);
            });
        }

        const changes = auditService.detectChanges(currentCandidate, candidate);
        if (changes) {
            const isStatusChange = !!changes.recruitmentStatus;
            await auditService.logAction(req, {
                action: isStatusChange ? 'MOVED' : 'UPDATE',
                module: 'Candidate',
                targetId: candidate._id,
                targetModel: 'Candidate',
                changes,
                details: isStatusChange 
                    ? `Candidate moved from ${changes.recruitmentStatus.old} to ${changes.recruitmentStatus.new}` 
                    : `Candidate "${candidate.name}" updated`
            });

            // --- DECTECT MENTIONS AND SEND NOTIFICATIONS ---
            if (candidateData.remarks && Array.isArray(candidateData.remarks)) {
                // Get pre-update remark IDs to identify new/modified ones
                const oldRemarkIds = new Set((currentCandidate.remarks || []).map(r => r._id?.toString()));
                
                for (const remark of candidateData.remarks) {
                    // Check if it's a new remark or if the text was changed in an existing one
                    const isNew = !remark._id || !oldRemarkIds.has(remark._id.toString());
                    const oldRemark = !isNew ? currentCandidate.remarks.find(r => r._id?.toString() === remark._id.toString()) : null;
                    const isChanged = oldRemark && oldRemark.text !== remark.text;

                    if ((isNew || isChanged) && remark.text) {
                        // Extract unique user IDs from mention tags
                        const mentionRegex = /data-user-id="([^"]+)"/g;
                        let match;
                        const mentionedIds = new Set();
                        
                        while ((match = mentionRegex.exec(remark.text)) !== null) {
                            const mentionedId = match[1];
                            // Skip if mentioned user is the sender (self-mention) or if it's the 'cn' (candidate) placeholder
                            if (mentionedId !== req.user._id.toString() && mentionedId !== 'cn') {
                                mentionedIds.add(mentionedId);
                            }
                        }

                        // Send notifications to all unique mentioned users
                        for (const userId of mentionedIds) {
                            try {
                                await notificationService.sendNotification(userId, {
                                    title: "New Mention",
                                    message: `${req.user.name} mentioned you in a note for candidate: ${candidate.name}`,
                                    type: "mention",
                                    path: `/candidates/${candidate._id}`,
                                    channels: ['in-app', 'email']
                                });
                                console.log(`[NOTIF] Triggered mention notification for user ${userId}`);
                            } catch (notifErr) {
                                console.error(`[NOTIF] Error sending mention notification to ${userId}:`, notifErr.message);
                            }
                        }
                    }
                }
            }
            // -----------------------------------------------
        }
        
        // Automate Task and Notification if recruiter changed
        if (isRecruiterSwitched) {
            const recruiterId = candidateData.createdBy;
            
            // Create Task
            await Task.create({
                title: `Follow up with Candidate`,
                description: `Candidate ${candidate.name} has been reassigned to you. Please follow up.`,
                assignedTo: recruiterId,
                candidate: candidate._id,
                status: 'Todo',
                priority: 'Medium',
                createdBy: req.user._id
            });

            // Create Notification
            await Notification.create({
                recipient: recruiterId,
                sender: req.user._id,
                title: 'New Candidate Assigned',
                message: `Candidate ${candidate.name} has been assigned to you.`,
                type: 'task',
                path: '/candidates'
            });
        }

        res.json(candidate);
    } catch (error) {
        console.error("Update candidate error DETAILS:", error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ error: "Invalid Candidate ID format." });
        }
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

// Delete Candidate
exports.deleteCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        // Role-base check - only admins can delete candidates
        // Non-admins cannot delete manually created candidates (admin-only)
        if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
            return res.status(403).json({ message: "Access denied: Only admins can delete candidates." });
        }

        await Candidate.findByIdAndDelete(req.params.id);

        await auditService.logAction(req, {
            action: 'DELETE',
            module: 'Candidate',
            targetId: candidate._id,
            targetModel: 'Candidate',
            details: `Candidate "${candidate.name}" deleted`
        });

        res.json({ message: "Candidate deleted successfully" });
    } catch (error) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ error: "Invalid Candidate ID format." });
        }
        res.status(500).json({ error: error.message });
    }
};

// Bulk Delete Candidates
exports.bulkDeleteCandidates = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: "Invalid IDs provided" });
        }
        await Candidate.deleteMany({ _id: { $in: ids } });
        res.json({ message: "Candidates deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk Update Recruiter (Owner)
exports.bulkSwitchRecruiter = async (req, res) => {
    try {
        const { ids, recruiterId, taskDetails } = req.body;
        if (!ids || !Array.isArray(ids) || !recruiterId) {
            return res.status(400).json({ message: "Invalid IDs or recruiter ID provided" });
        }

        const candidates = await Candidate.find({ _id: { $in: ids } }).select('name');

        await Candidate.updateMany(
            { _id: { $in: ids } },
            { $set: { createdBy: recruiterId } }
        );

        // Automate Task Creation
        const tasks = ids.map((id, index) => ({
            title: `Follow up with ${candidates[index]?.name || 'Candidate'}`,
            description: `A new candidate has been assigned to you. Please follow up.`,
            assignedTo: recruiterId,
            candidate: id,
            status: 'Todo',
            priority: taskDetails?.priority || 'Medium',
            dueDate: taskDetails?.dueDate || undefined,
            createdBy: req.user._id
        }));
        await Task.insertMany(tasks);

        // Automate Notification (Single consolidated notification)
        const notification = {
            recipient: recruiterId,
            sender: req.user._id,
            title: 'New Candidates Assigned',
            message: `${ids.length} candidates have been assigned to you for follow-up.`,
            type: 'task',
            path: '/candidates'
        };
        await Notification.create(notification);

        res.json({ message: `Successfully reassigned ${ids.length} candidates and created follow-up tasks` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send Bulk Email
exports.sendBulkEmail = async (req, res) => {
    try {
        const { ids, subject, content } = req.body;

        if (!subject || !content) {
            return res.status(400).json({ message: "Subject and content are required" });
        }

        let candidates = [];
        if (ids === 'all') {
            candidates = await Candidate.find({ status: 1 });
        } else if (Array.isArray(ids)) {
            candidates = await Candidate.find({ _id: { $in: ids } });
        } else {
            return res.status(400).json({ message: "Invalid candidate IDs" });
        }

        if (candidates.length === 0) {
            return res.status(404).json({ message: "No candidates found to send email" });
        }

        const results = await emailService.sendBulkEmails(candidates, subject, content);

        res.json({
            message: `Email process completed. ${results.success} sent, ${results.failed} failed.`,
            results
        });
    } catch (error) {
        console.error("Bulk email error:", error);
        res.status(500).json({ error: error.message });
    }
};

// AI Resume Processing
exports.parseResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No resume file uploaded." });
        }

        const filePath = req.file.path;
        console.log('[CONTROLLER] Parsing resume at:', filePath);

        const structuredData = await resumeParserService.parse(filePath);
        
        res.json({
            message: "Resume parsed successfully",
            data: structuredData
        });
    } catch (error) {
        console.error("Parse resume error:", error);
        if (error.message && error.message.includes('API Key is missing')) {
            return res.status(400).json({ error: "AI Parsing failed: " + error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

// Request Profile Update (Sends automated email)
exports.requestProfileUpdate = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        if (!candidate.email) {
            return res.status(400).json({ message: "Candidate does not have an email address" });
        }

        const subject = "Request for Updated Profile - @name";
        const template = `
            Dear @name,

            We hope you are doing well.

            We are currently reviewing your profile for several potential opportunities. To ensure we have your most recent information, could you please provide us with an updated copy of your profile/resume?

            Specifically, we are looking for:
            - Updated work experience
            - Latest contact information
            - Current salary and notice period (if applicable)

            You can reply to this email directly with your updated document.

            Best regards,
            Recruitment Team
        `.trim();

        await emailService.sendEmail(candidate, subject, template);

        // Optional: Log this as an activity note
        const sender = (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) 
            ? req.user._id 
            : null;

        const note = {
            content: "Sent automated request for updated profile.",
            createdAt: new Date(),
            createdBy: sender,
            isPinned: false
        };
        
        if (!candidate.remarks) candidate.remarks = [];
        candidate.remarks.push(note);
        await candidate.save();

        await auditService.logAction(req, {
            action: 'UPDATE',
            module: 'Candidate',
            targetId: candidate._id,
            targetModel: 'Candidate',
            details: `Requested updated profile from ${candidate.name}`
        });

        res.json({ message: "Profile update request sent successfully" });
    } catch (error) {
        console.error("Request profile update error:", error);
        res.status(500).json({ error: error.message });
    }
};

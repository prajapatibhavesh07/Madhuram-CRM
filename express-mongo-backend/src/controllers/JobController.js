const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const auditService = require('../services/auditService');

exports.createJob = async (req, res) => {
    try {
        const jobData = { ...req.body };
        if (req.file) {
            jobData.logo = `/uploads/logos/${req.file.filename}`;
        }
        
        // Parse nested JSON strings if they come from multipart form data
        if (typeof jobData.managers === 'string') {
            try { jobData.managers = JSON.parse(jobData.managers); } catch(e) {}
        }
        if (typeof jobData.questions === 'string') {
            try { jobData.questions = JSON.parse(jobData.questions); } catch(e) {}
        }

        const job = new Job({ ...jobData, postedBy: req.user?._id });
        await job.save();

        const primaryTitle = job.managers?.[0]?.title || 'Untitled Job';

        await auditService.logAction(req, {
            action: 'CREATE',
            module: 'Job',
            targetId: job._id,
            targetModel: 'Job',
            details: `Job "${primaryTitle}" created`
        });

        res.status(201).json(job);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getJobs = async (req, res) => {
    try {
        const filters = {};
        if (req.query.company) filters.company = { $regex: req.query.company, $options: 'i' };
        if (req.query.location) filters.location = { $regex: req.query.location, $options: 'i' };
        
        // Search within managers array
        if (req.query.title) filters['managers.title'] = { $regex: req.query.title, $options: 'i' };
        if (req.query.status) filters['managers.status'] = req.query.status;
        if (req.query.manager) filters['managers.name'] = { $regex: req.query.manager, $options: 'i' };
        if (req.query.channel) filters['managers.channel'] = { $regex: req.query.channel, $options: 'i' };
        if (req.query.fls) filters['managers.fls'] = { $regex: req.query.fls, $options: 'i' };
        if (req.query.nfls) filters['managers.nfls'] = { $regex: req.query.nfls, $options: 'i' };
        if (req.query.ctc) filters['managers.ctc'] = { $regex: req.query.ctc, $options: 'i' };

        const jobs = await Job.find(filters).populate('postedBy', 'name email').sort({ createdAt: -1 });

        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const candidateCount = await Candidate.countDocuments({ jobId: job._id });
            return { ...job.toObject(), candidateCount };
        }));

        res.json(jobsWithCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const candidateCount = await Candidate.countDocuments({ jobId: job._id });
        res.json({ ...job.toObject(), candidateCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const oldJob = await Job.findById(req.params.id);
        const jobData = { ...req.body };
        
        if (req.file) {
            jobData.logo = `/uploads/logos/${req.file.filename}`;
        }

        // Parse nested JSON strings if they come from multipart form data
        if (typeof jobData.managers === 'string') {
            try { jobData.managers = JSON.parse(jobData.managers); } catch(e) {}
        }
        if (typeof jobData.questions === 'string') {
            try { jobData.questions = JSON.parse(jobData.questions); } catch(e) {}
        }

        const job = await Job.findByIdAndUpdate(req.params.id, jobData, { new: true });
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const primaryTitle = job.managers?.[0]?.title || 'Untitled Job';

        const changes = auditService.detectChanges(oldJob, job);
        if (changes) {
            await auditService.logAction(req, {
                action: 'UPDATE',
                module: 'Job',
                targetId: job._id,
                targetModel: 'Job',
                changes,
                details: `Job "${primaryTitle}" updated`
            });
        }

        res.json(job);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const emailService = require('../services/emailService');

exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const primaryTitle = job.managers?.[0]?.title || 'Untitled Job';

        await auditService.logAction(req, {
            action: 'DELETE',
            module: 'Job',
            targetId: job._id,
            targetModel: 'Job',
            details: `Job "${primaryTitle}" deleted`
        });

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMultipleJobs = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Job IDs are required' });
        }
        await Job.deleteMany({ _id: { $in: ids } });
        res.json({ message: 'Jobs deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.emailCandidates = async (req, res) => {
    try {
        const jobId = req.params.id;
        const { subject, message, candidateId, candidateIds } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        // Find candidates that applied for this job
        let candidates;
        if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
            candidates = await Candidate.find({ _id: { $in: candidateIds }, jobId });
        } else if (candidateId) {
            candidates = await Candidate.find({ _id: candidateId, jobId });
        } else {
            candidates = await Candidate.find({ jobId });
        }

        if (candidates.length === 0) {
            return res.status(404).json({ message: 'No candidates found' });
        }

        // Send emails using the existing email service which supports tags like @name
        const results = await emailService.sendBulkEmails(candidates, subject, message);

        res.json({
            message: `Successfully emailed ${results.success} candidate(s). Failed: ${results.failed}`,
            results
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.shareCandidatesWithHR = async (req, res) => {
    try {
        const jobId = req.params.id;
        const { hrEmail, subject, message } = req.body;

        if (!hrEmail) {
            return res.status(400).json({ message: 'HR Email is required' });
        }

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const primaryTitle = job.managers?.[0]?.title || job.title || 'Untitled Job';
        const candidates = await Candidate.find({ jobId });

        if (candidates.length === 0) {
            return res.status(404).json({ message: 'No candidates have applied for this job yet' });
        }

        // Build HTML content
        const emailSubject = subject || `Candidates List: ${primaryTitle}`;
        const emailMessage = message ? `<p>${message.replace(/\n/g, '<br>')}</p>` : `<p>Please find below the details of the candidates who applied for the <strong>${primaryTitle}</strong> position.</p>`;

        let htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4f46e5;">Job Applications: ${primaryTitle}</h2>
                ${emailMessage}
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f3f4f6; text-align: left;">
                            <th style="padding: 12px; border: 1px solid #e5e7eb;">Name</th>
                            <th style="padding: 12px; border: 1px solid #e5e7eb;">Email</th>
                            <th style="padding: 12px; border: 1px solid #e5e7eb;">Phone</th>
                            <th style="padding: 12px; border: 1px solid #e5e7eb;">Experience</th>
                            <th style="padding: 12px; border: 1px solid #e5e7eb;">Current CTC</th>
                            <th style="padding: 12px; border: 1px solid #e5e7eb;">Resume</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        candidates.forEach(c => {
            const appUrl = process.env.APP_URL || 'http://localhost:5000';
            const resumeLink = c.resume ? `<a href="${appUrl}${c.resume.fileUrl}" style="color: #4f46e5; text-decoration: none;">Download</a>` : 'N/A';
            htmlContent += `
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${c.name || '-'}</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${c.email || '-'}</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${c.phone || '-'}</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${c.totalWorkExp != null ? c.totalWorkExp + ' Yrs' : '-'}</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${c.currentCTC ? '₹' + c.currentCTC + ' LPA' : '-'}</td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">${resumeLink}</td>
                </tr>
            `;
        });

        htmlContent += `
                    </tbody>
                </table>
                <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280;">This is an automated message from your CRM system.</p>
            </div>
        `;

        await emailService.sendRawEmail(hrEmail, emailSubject, htmlContent);

        res.json({ message: 'Candidate details forwarded to HR successfully' });

    } catch (error) {
        console.error('Error sharing candidates with HR:', error);
        res.status(500).json({ message: error.message });
    }
};

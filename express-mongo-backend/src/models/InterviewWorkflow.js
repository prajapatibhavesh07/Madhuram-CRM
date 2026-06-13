const mongoose = require('mongoose');

const workflowStageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    requirements: {
        requireResume: { type: Boolean, default: false },
        requireFeedback: { type: Boolean, default: false },
        requireOfferLetter: { type: Boolean, default: false },
        requireSalarySlip: { type: Boolean, default: false }
    },
    actions: {
        showRejectButton: { type: Boolean, default: true },
        showOfferButton: { type: Boolean, default: false },
        showOnboardingSettings: { type: Boolean, default: false }
    },
    automationRules: {
        sendEmail: { type: Boolean, default: false },
        emailTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null },
        updateCandidateStatus: { type: String, default: '' } // e.g. 'Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Rejected', 'Joined'
    },
    isEnabled: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false }
});

const interviewWorkflowSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    // Rules for matching candidates/jobs
    companyName: { type: String, default: '' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    category: { type: String, default: '' }, // e.g. BFSI, IT, Banking, EdTech, Insurance
    stages: [workflowStageSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('InterviewWorkflow', interviewWorkflowSchema);

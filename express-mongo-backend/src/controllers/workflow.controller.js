const InterviewWorkflow = require('../models/InterviewWorkflow');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const auditService = require('../services/auditService');

const DEFAULT_STAGES = [
    {
        name: 'Applied',
        requirements: { requireResume: false, requireFeedback: false, requireOfferLetter: false, requireSalarySlip: false },
        actions: { showRejectButton: true, showOfferButton: false, showOnboardingSettings: false },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: 'Applied' },
        isEnabled: true
    },
    {
        name: 'Scheduled',
        requirements: { requireResume: false, requireFeedback: false, requireOfferLetter: false, requireSalarySlip: false },
        actions: { showRejectButton: true, showOfferButton: false, showOnboardingSettings: false },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: 'Applied' },
        isEnabled: true
    },
    {
        name: 'Interview Done',
        requirements: { requireResume: false, requireFeedback: true, requireOfferLetter: false, requireSalarySlip: false },
        actions: { showRejectButton: true, showOfferButton: false, showOnboardingSettings: false },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: 'Interviewed' },
        isEnabled: true
    },
    {
        name: 'Short-List',
        requirements: { requireResume: false, requireFeedback: false, requireOfferLetter: false, requireSalarySlip: false },
        actions: { showRejectButton: true, showOfferButton: false, showOnboardingSettings: false },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: 'Shortlisted' },
        isEnabled: true
    },
    {
        name: 'First Round',
        requirements: { requireResume: false, requireFeedback: true, requireOfferLetter: false, requireSalarySlip: false },
        actions: { showRejectButton: true, showOfferButton: false, showOnboardingSettings: false },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: 'Interviewed' },
        isEnabled: true
    },
    {
        name: 'Second Round',
        requirements: { requireResume: false, requireFeedback: true, requireOfferLetter: false, requireSalarySlip: false },
        actions: { showRejectButton: true, showOfferButton: false, showOnboardingSettings: false },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: 'Interviewed' },
        isEnabled: true
    },
    {
        name: 'Final Round',
        requirements: { requireResume: false, requireFeedback: true, requireOfferLetter: false, requireSalarySlip: false },
        actions: { showRejectButton: true, showOfferButton: false, showOnboardingSettings: false },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: 'Interviewed' },
        isEnabled: true
    },
    {
        name: 'Selected',
        requirements: { requireResume: false, requireFeedback: false, requireOfferLetter: true, requireSalarySlip: true },
        actions: { showRejectButton: true, showOfferButton: true, showOnboardingSettings: false },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: 'Offered' },
        isEnabled: true
    },
    {
        name: 'Document Pre-offer',
        requirements: { requireResume: false, requireFeedback: false, requireOfferLetter: false, requireSalarySlip: false },
        actions: { showRejectButton: false, showOfferButton: false, showOnboardingSettings: true },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: 'Joined' },
        isEnabled: true
    }
];

const seedDefaultWorkflow = async () => {
    let defaultWorkflow = await InterviewWorkflow.findOne({ isDefault: true });
    if (!defaultWorkflow) {
        defaultWorkflow = new InterviewWorkflow({
            name: 'Default Workflow',
            description: 'Standard system interview process workflow.',
            isActive: true,
            isDefault: true,
            stages: DEFAULT_STAGES
        });
        await defaultWorkflow.save();
    }
    return defaultWorkflow;
};

// GET /api/workflows
exports.getWorkflows = async (req, res) => {
    try {
        await seedDefaultWorkflow();
        const workflows = await InterviewWorkflow.find()
            .populate('jobId', 'title company')
            .sort({ isDefault: -1, name: 1 });
        res.json(workflows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/workflows/resolve
exports.resolveWorkflow = async (req, res) => {
    try {
        const { candidateId, jobId, companyName, category } = req.query;
        await seedDefaultWorkflow();

        let workflow = null;

        // 1. Resolve by Candidate Info if candidateId provided
        if (candidateId) {
            const candidate = await Candidate.findById(candidateId).populate('jobId');
            if (candidate) {
                // Try job-specific workflow
                if (candidate.jobId) {
                    workflow = await InterviewWorkflow.findOne({ jobId: candidate.jobId._id, isActive: true });
                    if (!workflow && candidate.jobId.company) {
                        workflow = await InterviewWorkflow.findOne({ companyName: candidate.jobId.company, isActive: true });
                    }
                }
                // Try company specific workflow
                if (!workflow && candidate.currentCompany) {
                    workflow = await InterviewWorkflow.findOne({ companyName: candidate.currentCompany, isActive: true });
                }
                // Try category specific workflow
                if (!workflow && candidate.sector) {
                    workflow = await InterviewWorkflow.findOne({ category: candidate.sector, isActive: true });
                }
            }
        }

        // 2. Fallback to parameters
        if (!workflow && jobId) {
            workflow = await InterviewWorkflow.findOne({ jobId, isActive: true });
            if (!workflow) {
                const job = await Job.findById(jobId);
                if (job && job.company) {
                    workflow = await InterviewWorkflow.findOne({ companyName: job.company, isActive: true });
                }
            }
        }
        if (!workflow && companyName) {
            workflow = await InterviewWorkflow.findOne({ companyName, isActive: true });
        }
        if (!workflow && category) {
            workflow = await InterviewWorkflow.findOne({ category, isActive: true });
        }

        // 3. Fallback to default workflow
        if (!workflow) {
            workflow = await InterviewWorkflow.findOne({ isDefault: true });
        }

        res.json(workflow);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/workflows/:id
exports.getWorkflowById = async (req, res) => {
    try {
        const workflow = await InterviewWorkflow.findById(req.params.id).populate('jobId', 'title company');
        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
        res.json(workflow);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/workflows
exports.createWorkflow = async (req, res) => {
    try {
        const { isDefault } = req.body;

        // If this workflow is set as default, unset other default workflows
        if (isDefault) {
            await InterviewWorkflow.updateMany({ isDefault: true }, { isDefault: false });
        }

        const workflow = new InterviewWorkflow({
            ...req.body,
            createdBy: req.user?._id
        });
        await workflow.save();

        await auditService.logAction(req, {
            action: 'CREATE',
            module: 'Workflow',
            targetId: workflow._id,
            targetModel: 'InterviewWorkflow',
            details: `Created workflow: ${workflow.name}`
        });

        res.status(201).json(workflow);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// PUT /api/workflows/:id
exports.updateWorkflow = async (req, res) => {
    try {
        const { isDefault } = req.body;
        const oldWorkflow = await InterviewWorkflow.findById(req.params.id);
        if (!oldWorkflow) return res.status(404).json({ message: 'Workflow not found' });

        // If default status changes to true, unset others
        if (isDefault && !oldWorkflow.isDefault) {
            await InterviewWorkflow.updateMany({ isDefault: true }, { isDefault: false });
        }

        const workflow = await InterviewWorkflow.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: req.user?._id },
            { new: true }
        );

        const changes = auditService.detectChanges(oldWorkflow, workflow);
        if (changes) {
            await auditService.logAction(req, {
                action: 'UPDATE',
                module: 'Workflow',
                targetId: workflow._id,
                targetModel: 'InterviewWorkflow',
                changes,
                details: `Updated workflow: ${workflow.name}`
            });
        }

        res.json(workflow);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE /api/workflows/:id
exports.deleteWorkflow = async (req, res) => {
    try {
        const workflow = await InterviewWorkflow.findById(req.params.id);
        if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
        if (workflow.isDefault) return res.status(400).json({ message: 'Cannot delete the default system workflow' });

        await InterviewWorkflow.findByIdAndDelete(req.params.id);

        await auditService.logAction(req, {
            action: 'DELETE',
            module: 'Workflow',
            targetId: workflow._id,
            targetModel: 'InterviewWorkflow',
            details: `Deleted workflow: ${workflow.name}`
        });

        res.json({ message: 'Workflow deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/workflows/:id/duplicate
exports.duplicateWorkflow = async (req, res) => {
    try {
        const sourceWorkflow = await InterviewWorkflow.findById(req.params.id);
        if (!sourceWorkflow) return res.status(404).json({ message: 'Source workflow not found' });

        let uniqueName = `${sourceWorkflow.name} (Copy)`;
        let suffix = 1;
        while (await InterviewWorkflow.findOne({ name: uniqueName })) {
            uniqueName = `${sourceWorkflow.name} (Copy ${suffix++})`;
        }

        // Duplicate stage definitions
        const stagesCopy = sourceWorkflow.stages.map(stage => ({
            name: stage.name,
            requirements: { ...stage.requirements },
            actions: { ...stage.actions },
            automationRules: { ...stage.automationRules },
            isEnabled: stage.isEnabled,
            isArchived: stage.isArchived
        }));

        const newWorkflow = new InterviewWorkflow({
            name: uniqueName,
            description: sourceWorkflow.description || `Copy of ${sourceWorkflow.name}`,
            isActive: true,
            isDefault: false,
            companyName: sourceWorkflow.companyName,
            jobId: sourceWorkflow.jobId,
            category: sourceWorkflow.category,
            stages: stagesCopy,
            createdBy: req.user?._id
        });

        await newWorkflow.save();

        await auditService.logAction(req, {
            action: 'CREATE',
            module: 'Workflow',
            targetId: newWorkflow._id,
            targetModel: 'InterviewWorkflow',
            details: `Duplicated workflow "${sourceWorkflow.name}" as "${newWorkflow.name}"`
        });

        res.status(201).json(newWorkflow);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

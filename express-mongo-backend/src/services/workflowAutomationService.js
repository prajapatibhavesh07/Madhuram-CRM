const Candidate = require('../models/Candidate');
const Template = require('../models/Template');
const InterviewWorkflow = require('../models/InterviewWorkflow');
const emailService = require('../services/emailService');

/**
 * Runs the configured automation rules for a given stage update.
 * @param {object} interview 
 * @param {string} newStage 
 */
async function runStageWorkflowAutomation(interview, newStage) {
    try {
        if (!interview || !interview.candidateId || !newStage) return;

        // Fetch Candidate
        const candidate = await Candidate.findById(interview.candidateId);
        if (!candidate) return;

        // Resolve matched workflow
        let workflow = null;
        if (interview.jobId) {
            workflow = await InterviewWorkflow.findOne({ jobId: interview.jobId, isActive: true });
        }
        if (!workflow && candidate.jobId) {
            workflow = await InterviewWorkflow.findOne({ jobId: candidate.jobId, isActive: true });
        }
        if (!workflow && interview.companyName) {
            workflow = await InterviewWorkflow.findOne({ companyName: interview.companyName, isActive: true });
        }
        if (!workflow && candidate.sector) {
            workflow = await InterviewWorkflow.findOne({ category: candidate.sector, isActive: true });
        }
        if (!workflow) {
            workflow = await InterviewWorkflow.findOne({ isDefault: true });
        }

        if (!workflow) return;

        // Find Stage config
        const stageConfig = workflow.stages.find(s => s.name.toLowerCase() === newStage.toLowerCase() && s.isEnabled && !s.isArchived);
        if (!stageConfig) return;

        // Execute Automation Rules
        const { automationRules } = stageConfig;
        if (!automationRules) return;

        // Rule 1: Update Candidate ATS Status
        if (automationRules.updateCandidateStatus) {
            candidate.recruitmentStatus = automationRules.updateCandidateStatus;
            await candidate.save();
        }

        // Rule 2: Send Email
        if (automationRules.sendEmail && automationRules.emailTemplateId) {
            const template = await Template.findById(automationRules.emailTemplateId);
            if (template && candidate.email) {
                await emailService.sendEmail(
                    candidate,
                    template.subject || 'Interview Update',
                    template.body
                );
            }
        }
    } catch (err) {
        console.error('[WORKFLOW AUTOMATION ERROR]', err);
    }
}

module.exports = { runStageWorkflowAutomation };

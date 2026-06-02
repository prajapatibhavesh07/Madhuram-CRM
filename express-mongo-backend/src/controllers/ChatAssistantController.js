const crmChatService = require('../services/crmChatService');
const Candidate = require('../models/Candidate');
const aiService = require('../services/aiService');
const resumeGeneratorService = require('../services/resumeGeneratorService');

exports.askAssistant = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        const result = await crmChatService.processQuery(query, req.user);
        res.json(result);
    } catch (error) {
        console.error("AI Assistant Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getCompanySuggestions = async (req, res) => {
    try {
        const { candidateData, openJobs, mode } = req.body;
        const result = await require('../services/aiService').getCompanySuggestions(candidateData, openJobs, mode);
        res.json(result);
    } catch (error) {
        console.error("AI Suggestion Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.generateResume = async (req, res) => {
    try {
        const { candidateId } = req.body;
        if (!candidateId) {
            return res.status(400).json({ error: "Candidate ID is required" });
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ error: "Candidate not found" });
        }

        // Gather data for AI
        const candidateData = {
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            location: candidate.location,
            skills: candidate.sector?.split(',').map(s => s.trim()) || [],
            experience: candidate.extractedExperience || [],
            education: candidate.extractedEducation || []
        };

        // Step 1: Professionalize with AI
        const aiPolishedData = await aiService.generateResumeData(candidateData);

        // Step 2: Generate PDF
        const pdfBuffer = await resumeGeneratorService.generateResume(candidate, aiPolishedData);

        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Resume_${candidate.name.replace(/\s+/g, '_')}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Generate Resume Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.generateCustomResume = async (req, res) => {
    try {
        const { candidateId } = req.body;
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) return res.status(404).json({ error: "Candidate not found" });

        const Settings = require('../models/Settings');
        const settings = await Settings.findOne();

        const pdfBuffer = await resumeGeneratorService.generateCustomHtmlResume(candidate, settings);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${candidate.name}_Resume.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Generate Custom Resume Error:", error);
        res.status(500).json({ error: error.message });
    }
};

const scoringService = require('../services/scoringService');

exports.scoreCandidate = async (req, res) => {
    try {
        const { candidateId, jobId } = req.body;
        if (!candidateId || !jobId) {
            return res.status(400).json({ error: "Candidate ID and Job ID are required" });
        }

        console.log(`[CONTROLLER] Triggering scoring for candidate ${candidateId} and job ${jobId}`);
        const result = await scoringService.scoreCandidateForJob(candidateId, jobId);
        res.json(result);
    } catch (error) {
        console.error("AI Scoring Error:", error);
        res.status(500).json({ error: error.message });
    }
};

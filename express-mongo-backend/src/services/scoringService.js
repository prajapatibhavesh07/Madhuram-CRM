const aiService = require('./aiService');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');

class ScoringService {
    constructor() {
        this.isOpenAIQuotaExceeded = false;
        this.quotaExceededResetTime = 0;
    }

    /**
     * Scores a candidate against a specific job.
     * @param {String} candidateId 
     * @param {String} jobId 
     */
    async scoreCandidateForJob(candidateId, jobId) {
        try {
            const candidate = await Candidate.findById(candidateId);
            const job = await Job.findById(jobId);

            if (!candidate || !job) {
                throw new Error('Candidate or Job not found');
            }

            const candidateData = {
                skills: candidate.skills || candidate.extractedSkills,
                experience: candidate.experience || candidate.extractedExperience,
                education: candidate.education || candidate.extractedEducation,
                summary: candidate.aiSummary || candidate.remark
            };

            const jobDescription = `
                Job Title: ${job.title}
                Company: ${job.company}
                Description: ${job.description}
                Requirements: ${job.requirements}
            `;

            let result;
            const now = Date.now();
            if (this.isOpenAIQuotaExceeded && now < this.quotaExceededResetTime) {
                console.log(`[SCORING] OpenAI quota is known to be exceeded (cached). Using local match heuristics for ${candidate.name}...`);
                result = this.calculateLocalFallbackScore(candidate, job);
            } else {
                try {
                    console.log(`[SCORING] Attempting OpenAI scoring for candidate ${candidate.name} against job ${job.title}...`);
                    result = await aiService.scoreCandidate(candidateData, jobDescription);
                    this.isOpenAIQuotaExceeded = false;
                } catch (aiError) {
                    const errMsg = aiError.message || "";
                    if (errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('limit')) {
                        this.isOpenAIQuotaExceeded = true;
                        this.quotaExceededResetTime = Date.now() + (5 * 60 * 1000); // Cache for 5 mins
                        console.warn(`[SCORING] OpenAI quota/rate-limit exceeded. Caching status for 5 minutes.`);
                    }
                    console.warn(`[SCORING] OpenAI scoring failed: ${errMsg}. Falling back to local match heuristics...`);
                    result = this.calculateLocalFallbackScore(candidate, job);
                }
            }

            // Update candidate with AI result
            candidate.aiScore = result.score || 0;
            candidate.aiSummary = result.summary || "";
            candidate.aiMatchBasis = {
                matchReason: result.matchReason || "",
                skillFit: result.skillFit || "Medium",
                experienceGap: result.experienceGap || "Medium"
            };

            await candidate.save();
            return result;
        } catch (error) {
            console.error('[SCORING] Error in scoring service:', error.message);
            throw error;
        }
    }

    /**
     * Calculates a matching score locally based on resume details vs job profile.
     */
    calculateLocalFallbackScore(candidate, job) {
        let score = 50; // Base score
        let matchReason = "Calculated using local profile matching heuristics.";
        let skillFit = "Medium";
        let experienceGap = "Medium";
        let summary = "Local match analysis completed successfully.";

        try {
            let skillScore = 0;
            let expScore = 0;
            let locScore = 0;

            // 1. Skill Matching (up to 30 points)
            const candidateSkills = [
                ...(candidate.skills ? (Array.isArray(candidate.skills) ? candidate.skills : [candidate.skills]) : []),
                ...(candidate.extractedSkills || [])
            ].map(s => s.toLowerCase().trim());

            const jobText = `
                ${job.title || ''}
                ${job.description || ''}
                ${(job.requirements || []).join(' ')}
            `.toLowerCase();

            if (candidateSkills.length > 0) {
                let matched = 0;
                candidateSkills.forEach(skill => {
                    if (jobText.includes(skill)) {
                        matched++;
                    }
                });
                skillScore = Math.min(30, Math.round((matched / Math.max(3, candidateSkills.length)) * 50));
            } else {
                skillScore = 15; // default if no skills listed
            }

            // 2. Title & Designation Matching (up to 30 points)
            const jobTitle = (job.title || '').toLowerCase();
            const candProfile = (candidate.currentProfile || '').toLowerCase();
            const candDesignation = (candidate.designation || '').toLowerCase();

            if (jobTitle && (candProfile.includes(jobTitle) || jobTitle.includes(candProfile) || candDesignation.includes(jobTitle) || jobTitle.includes(candDesignation))) {
                expScore += 20;
            } else {
                // Check keyword intersections
                const titleKeywords = jobTitle.split(/\s+/).filter(w => w.length > 3);
                const matchCount = titleKeywords.filter(w => candProfile.includes(w) || candDesignation.includes(w)).length;
                if (matchCount > 0) {
                    expScore += 10 + (matchCount * 5);
                }
            }

            // Experience years matching (up to 10 points)
            const expYears = candidate.totalWorkExp || 0;
            if (expYears > 0) {
                expScore += Math.min(10, expYears * 2);
            }

            // 3. Location Matching (up to 15 points)
            const candLoc = (candidate.location || '').toLowerCase().trim();
            const jobLoc = (job.location || '').toLowerCase().trim();
            if (candLoc && jobLoc && (candLoc.includes(jobLoc) || jobLoc.includes(candLoc))) {
                locScore = 15;
            } else if (candidate.willingToRelocate) {
                locScore = 10;
            } else {
                locScore = 5;
            }

            // Total Score calculation
            const calculated = 30 + skillScore + expScore + locScore;
            score = Math.min(98, Math.max(35, calculated));

            // Determine fits
            if (score >= 80) {
                skillFit = "High";
                experienceGap = "Low";
                matchReason = `Excellent match! The candidate's skills and profile align perfectly with the ${job.title || 'role'} requirements.`;
            } else if (score >= 60) {
                skillFit = "Medium";
                experienceGap = "Medium";
                matchReason = `Good match. The candidate possesses relevant experience and some matching skills for the ${job.title || 'role'}.`;
            } else {
                skillFit = "Low";
                experienceGap = "High";
                matchReason = `Basic match. The candidate's background shows some overlap, but there are notable skill or experience gaps for the ${job.title || 'role'}.`;
            }

            summary = `Candidate "${candidate.name}" scored ${score}% against "${job.title || 'role'}" at ${job.company || 'company'}. Key strengths include experience in ${candidate.currentCompany || 'their previous role'} and relevant background in ${candidate.sector || 'the industry'}.`;

        } catch (e) {
            console.error('[SCORING] Error in local heuristic scoring:', e.message);
        }

        return {
            score,
            matchReason,
            skillFit,
            experienceGap,
            summary
        };
    }
}

module.exports = new ScoringService();

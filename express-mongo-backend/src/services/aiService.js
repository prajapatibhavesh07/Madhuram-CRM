const { OpenAI } = require('openai');
const Settings = require('../models/Settings');

class AIService {
    async getClient() {
        const settings = await Settings.findOne();
        const apiKey = settings?.apiKeys?.openai || process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            throw new Error('OpenAI API Key is missing. Please configure it in System Settings.');
        }

        return new OpenAI({
            apiKey: apiKey,
        });
    }

    /**
     * General purpose chat completion helper.
     */
    async chat(prompt, systemPrompt = "You are a helpful CRM assistant.") {
        try {
            const openai = await this.getClient();
            
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error('[AI] Error in chat completion:', error.message);
            throw error;
        }
    }

    /**
     * Specific helper for resume parsing.
     */
    async parseResume(text) {
        const systemPrompt = `
            You are an expert HR recruitment assistant. 
            Extract structured information from the following resume text.
            Return a JSON object with these fields:
            - name
            - email
            - phone
            - location
            - skills (Array of strings)
            - experience (Array of objects with title, company, duration, description)
            - education (Array of objects with degree, institution, year)
            - summary (A brief professional summary)
        `;

        return this.chat(text, systemPrompt);
    }

    /**
     * Specific helper for candidate scoring.
     */
    async scoreCandidate(candidateData, jobDescription) {
        const prompt = `
            Compare this candidate with the job description.
            Candidate Data: ${JSON.stringify(candidateData)}
            Job Description: ${jobDescription}
            
            Return a JSON object with:
            - score (0-100)
            - matchReason (String)
            - skillFit (String: High, Medium, Low)
            - experienceGap (String: High, Medium, Low)
            - summary (A brief explanation for the score)
        `;

        const systemPrompt = "You are an expert technical recruiter providing analytical candidate scores.";
        return this.chat(prompt, systemPrompt);
    }

    /**
     * Suggest companies based on candidate profile.
     */
    async getCompanySuggestions(candidateData, openJobs = [], mode = 'global') {
        const skills = candidateData.skills?.join(', ') || 'N/A';
        const history = (candidateData.experience || []).map(e => `${e.title} at ${e.companyName}`).join(', ') || 'N/A';
        const education = (candidateData.education || []).map(e => `${e.degree} from ${e.institution}`).join(', ') || 'N/A';

        let prompt = "";
        let systemPrompt = "You are an expert recruitment consultant.";

        if (mode === 'openJobs') {
            const jobCompanies = openJobs.map(j => j.company).filter(Boolean);
            prompt = `
                Candidate Profile:
                - Skills: ${skills}
                - Experience: ${history}
                - Education: ${education}

                Available Open Jobs at these companies: ${jobCompanies.join(', ')}

                Based on the candidate's profile, suggest the top 5 companies from the "Available Open Jobs" list that would be the best fit.
                If fewer than 5 match well, only suggest the good matches.
                Return a JSON object with a field "companies" containing an array of strings.
            `;
        } else {
            prompt = `
                Candidate Profile:
                - Skills: ${skills}
                - Experience: ${history}
                - Education: ${education}

                Suggest 5-8 top-tier global companies that would be a perfect fit for this candidate's career path.
                Return a JSON object with a field "companies" containing an array of strings.
            `;
        }

        const result = await this.chat(prompt, systemPrompt);
        return result.companies || [];
    }

    /**
     * Generate professional resume content from candidate data.
     */
    async generateResumeData(candidateData) {
        const prompt = `
            You are a professional resume writer.
            Create a highly professional resume structure for this candidate.
            Candidate Data: ${JSON.stringify(candidateData)}

            Return a JSON object with:
            - professionalSummary (A compelling 3-4 sentence summary)
            - polishedExperience (Array of objects with title, companyName, duration, and 3-4 professional bullet points for achievements/responsibilities)
            - polishedEducation (Array of objects with qualification, schoolName, and date)
            - polishedSkills (Categorized array of skills, e.g., "Technical", "Soft Skills")
        `;

        const systemPrompt = "You are a professional executive resume writer. Focus on achievements and high-impact language.";
        return this.chat(prompt, systemPrompt);
    }
}

module.exports = new AIService();

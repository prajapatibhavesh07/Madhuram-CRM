const aiService = require('./aiService');
const Candidate = require('../models/Candidate');
const Task = require('../models/Task');
const Job = require('../models/Job');

class CRMChatService {
    /**
     * Processes a natural language query about the CRM data.
     */
    async processQuery(query, user) {
        try {
            // 1. Fetch relevant context summaries
            const stats = await this.getSystemStats();
            
            const systemPrompt = `
                You are the CRM AI Assistant. You have access to the following system context:
                - Statistics: ${JSON.stringify(stats)}
                - User Role: ${user.role}
                - User Name: ${user.name}
                
                Guidelines:
                1. If the user asks for "top candidates", assume they mean based on 'aiScore'.
                2. If they ask for "overdue tasks", point them to tasks where dueDate < now.
                3. Be professional, concise, and helpful.
                4. Always return a JSON object with:
                   - answer (Markdown formatted string)
                   - suggestions (Array of strings for follow-up questions)
                   - action (Optional: { type: 'navigate', path: '/candidates' })
            `;

            console.log(`[CRM-CHAT] Processing query: "${query}" for user ${user.name}`);
            
            let result;
            try {
                // Check if we already cached that OpenAI is out of quota
                const scoringService = require('./scoringService');
                const now = Date.now();
                if (scoringService.isOpenAIQuotaExceeded && now < scoringService.quotaExceededResetTime) {
                    console.log(`[CRM-CHAT] OpenAI quota is known to be exceeded (cached). Using local fallback response...`);
                    result = this.generateLocalFallbackResponse(query, stats, user);
                } else {
                    result = await aiService.chat(query, systemPrompt);
                }
            } catch (aiError) {
                console.warn(`[CRM-CHAT] OpenAI chat failed: ${aiError.message}. Falling back to local response...`);
                // Update quota cache if it was a rate limit / quota error
                const errMsg = aiError.message || "";
                if (errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('limit')) {
                    const scoringService = require('./scoringService');
                    scoringService.isOpenAIQuotaExceeded = true;
                    scoringService.quotaExceededResetTime = Date.now() + (5 * 60 * 1000); // 5 mins
                }
                result = this.generateLocalFallbackResponse(query, stats, user);
            }
            
            return result;
        } catch (error) {
            console.error('[CRM-CHAT] Error processing query:', error.message);
            throw error;
        }
    }

    /**
     * Generates a context-aware fallback response locally from DB stats.
     */
    generateLocalFallbackResponse(query, stats, user) {
        const q = query.toLowerCase().trim();
        let answer = "";
        let suggestions = [
            "Show system overview stats",
            "Who are the top candidates?",
            "What are the pending tasks?",
            "How many open jobs do we have?"
        ];
        let action = null;

        if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
            answer = `### Hello, ${user.name}! 👋\n\nI am your **CRM Assistant** (currently running in offline fallback mode).\n\nHere is a quick overview of what I can help you with:\n- System statistics (Candidates, Tasks, Jobs)\n- Listing top-rated candidates\n- Reviewing pending follow-ups and tasks\n\nHow can I help you today?`;
        } else if (q.includes('candidate') || q.includes('top') || q.includes('score')) {
            const list = stats.topCandidates.map(c => `- **${c.name}** (${c.currentProfile || 'No Profile'}) - Match Score: **${c.aiScore || 0}%**`).join('\n');
            answer = `### 🏆 Top Candidates\n\nHere are the top candidates currently in the system based on their match profiles:\n\n${list || '*No candidates available.*'}\n\nWould you like me to take you to the candidates list to view more details?`;
            action = { type: 'navigate', path: '/candidates' };
            suggestions = ["Show pending tasks", "How many open jobs do we have?"];
        } else if (q.includes('task') || q.includes('todo') || q.includes('overdue') || q.includes('schedule')) {
            const list = stats.recentTasks.map(t => {
                const dateStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A';
                return `- **${t.title}** - Due: *${dateStr}* (Status: **${t.status}**)`;
            }).join('\n');
            answer = `### 📋 Pending Tasks\n\nHere are the active and upcoming tasks requiring attention:\n\n${list || '*No pending tasks found! All caught up. 🎉*'}\n\nI can navigate you to the tasks board to manage them.`;
            action = { type: 'navigate', path: '/tasks' };
            suggestions = ["Who are the top candidates?", "Show system overview stats"];
        } else if (q.includes('job') || q.includes('vacancy') || q.includes('open')) {
            answer = `### 💼 Open Job Positions\n\nWe currently have **${stats.openJobs} open job positions** listed in the portal.\n\nWould you like to navigate to the jobs board to view descriptions or manage candidate matching?`;
            action = { type: 'navigate', path: '/jobs' };
            suggestions = ["Who are the top candidates?", "Show system overview stats"];
        } else {
            // General status overview fallback
            answer = `### 📊 CRM System Overview\n\nHere is the current state of the CRM portal:\n\n* **Candidates**: **${stats.candidateCount}** active profiles\n* **Pending Tasks**: **${stats.pendingTasks}** tasks requiring action\n* **Open Positions**: **${stats.openJobs}** job listings active\n\n*(Note: System OpenAI API connection is currently undergoing maintenance/quota limits, so some advanced generative summaries are in local fallback mode.)*`;
        }

        return {
            answer,
            suggestions,
            ...(action ? { action } : {})
        };
    }

    async getSystemStats() {
        const candidateCount = await Candidate.countDocuments({ status: 1 });
        const pendingTasks = await Task.countDocuments({ status: { $ne: 'Completed' } });
        const openJobs = await Job.countDocuments({ status: 'Open' });
        
        // Get top 5 candidates by AI score
        const topCandidates = await Candidate.find({ status: 1 })
            .sort({ aiScore: -1 })
            .limit(5)
            .select('name aiScore currentProfile');

        // Get recent 5 tasks
        const recentTasks = await Task.find({ status: { $ne: 'Completed' } })
            .sort({ dueDate: 1 })
            .limit(5)
            .select('title dueDate status');

        return {
            candidateCount,
            pendingTasks,
            openJobs,
            topCandidates,
            recentTasks
        };
    }
}

module.exports = new CRMChatService();

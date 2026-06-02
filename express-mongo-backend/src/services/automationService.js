const Task = require('../models/Task');
const notificationService = require('./notificationService');
const aiService = require('./aiService');
const emailService = require('./emailService');
const Leave = require('../models/Leave');

/**
 * Service to handle automated workflows (e.g., overdue task reminders).
 */
class AutomationService {
    constructor() {
        this.checkInterval = 60000 * 60; // Check every hour
    }

    start() {
        console.log('[AUTOMATION] Service started');
        setInterval(() => {
            this.checkOverdueTasks();
            this.checkTaskReminders();
            this.cleanupOldPendingLeaves();
        }, this.checkInterval);
        
        // Also run once on start
        this.checkOverdueTasks();
        this.checkTaskReminders();
        this.cleanupOldPendingLeaves();
    }

    async checkOverdueTasks() {
        try {
            const now = new Date();
            const overdueTasks = await Task.find({
                dueDate: { $lt: now },
                status: { $ne: 'Completed' },
                overdueNotified: { $ne: true }
            }).populate('assignedTo', 'name email');

            console.log(`[AUTOMATION] Checking for overdue tasks... Found ${overdueTasks.length}`);

            for (const task of overdueTasks) {
                await notificationService.sendNotification(task.assignedTo._id, {
                    title: 'Task Overdue',
                    message: `The task "${task.title}" is past its due date.`,
                    type: 'warning',
                    path: '/tasks',
                    channels: ['in-app', 'email']
                });

                task.overdueNotified = true;
                await task.save();
            }
        } catch (error) {
            console.error('[AUTOMATION] Error checking overdue tasks:', error.message);
        }
    }

    async checkTaskReminders() {
        try {
            const now = new Date();
            const reminderTasks = await Task.find({
                reminderTime: { $lt: now },
                status: { $nin: ['Completed', 'Cancelled'] },
                reminderNotified: { $ne: true }
            }).populate('assignedTo', 'name email');

            if (reminderTasks.length > 0) {
                console.log(`[AUTOMATION] Sending ${reminderTasks.length} reminders...`);
            }

            for (const task of reminderTasks) {
                await notificationService.sendNotification(task.assignedTo._id, {
                    title: 'Task Reminder',
                    message: `Reminder: The task "${task.title}" is due soon.`,
                    type: 'info',
                    path: '/tasks',
                    channels: ['in-app', 'email']
                });

                task.reminderNotified = true;
                await task.save();
            }
        } catch (error) {
            console.error('[AUTOMATION] Error checking task reminders:', error.message);
        }
    }

    async cleanupOldPendingLeaves() {
        try {
            const currentYear = new Date().getFullYear();
            const result = await Leave.deleteMany({
                status: 'Pending',
                startDate: { $lt: new Date(currentYear, 0, 1) } 
            });
            if (result.deletedCount > 0) {
                console.log(`[CLEANUP] Deleted ${result.deletedCount} old pending leaves`);
            }
        } catch (error) {
            console.error('[CLEANUP] Error cleaning up leaves:', error.message);
        }
    }

    /**
     * Sends an AI-powered auto-reply to a new candidate.
     */
    async autoReplyToCandidate(candidate) {
        try {
            const prompt = `
                A new candidate has applied. 
                Name: ${candidate.name}
                Profile: ${candidate.currentProfile}
                
                Generate a professional, warm, and welcoming email response. 
                Include a mention that our team will review their profile shortly.
                Return JSON with:
                - subject (String)
                - body (Markdown String)
            `;

            console.log(`[AUTOMATION] Generating AI auto-reply for ${candidate.name}`);
            const response = await aiService.chat(prompt, "You are a friendly HR recruitment assistant.");

            await emailService.sendEmail(
                { email: candidate.email, name: candidate.name },
                response.subject,
                response.body
            );

            console.log(`[AUTOMATION] AI auto-reply sent to ${candidate.email}`);
        } catch (error) {
            console.error('[AUTOMATION] Error sending AI auto-reply:', error.message);
        }
    }
}

module.exports = new AutomationService();

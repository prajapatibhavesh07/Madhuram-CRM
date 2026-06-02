const Notification = require('../models/Notification');
const emailService = require('./emailService');
const twilioService = require('./twilioService');
const User = require('../models/User');

/**
 * Multi-channel Notification Orchestrator.
 */
class NotificationService {
    /**
     * Centralized function to send notifications across various channels.
     * @param {String} recipientId - User ID of the recipient
     * @param {Object} options - Notification options
     * @param {String} options.title - Short title for the notification
     * @param {String} options.message - Full message content
     * @param {String} [options.type] - Category (task, interview, system, etc.)
     * @param {String} [options.path] - Frontend URL to redirect when clicked
     * @param {Array} [options.channels] - Channels to trigger (['in-app', 'email', 'sms', 'whatsapp'])
     * @param {Object} [options.metadata] - Extra data for email templates or logging
     */
    async sendNotification(recipientId, { title, message, type = 'info', path = '', channels = ['in-app'], metadata = {} }) {
        try {
            const recipient = await User.findById(recipientId);
            if (!recipient) return;

            // 1. In-App Notification
            if (channels.includes('in-app')) {
                const newNotification = await Notification.create({
                    recipient: recipientId,
                    title,
                    message,
                    type,
                    path
                });

                // Emit real-time notification
                const socketIO = require('./socket'); // We'll need to fix this path or use the correct one
                const io = require('../config/socket').getIO();
                if (io) {
                    io.to(recipientId.toString()).emit('new_notification', newNotification);
                }
            }

            // 2. Email Notification
            if (channels.includes('email') && recipient.email) {
                await emailService.sendEmail(
                    { email: recipient.email, name: recipient.name },
                    title,
                    message
                );
            }

            // 3. SMS Notification
            if (channels.includes('sms') && recipient.phone) {
                await twilioService.sendSMS(recipient.phone, `${title}: ${message}`);
            }

            // 4. WhatsApp Notification
            if (channels.includes('whatsapp') && recipient.whatsapp) {
                await twilioService.sendWhatsApp(recipient.whatsapp, `${title}: ${message}`);
            }

        } catch (error) {
            console.error('[NOTIF] Failed to send notification:', error.message);
        }
    }
}

module.exports = new NotificationService();

const cron = require('node-cron');
const Candidate = require('../models/Candidate');
const Notification = require('../models/Notification');
const User = require('../models/User');

class CronService {
    init() {
        // Run daily at midnight (0 0 * * *)
        cron.schedule('0 0 * * *', async () => {
            console.log('Running daily ticket expiration check...');
            try {
                await this.checkExpiringTickets();
            } catch (error) {
                console.error('Error running ticket expiration CRON:', error);
            }
        });
        console.log('CronService initialized');
    }

    async checkExpiringTickets() {
        const candidates = await Candidate.find({ 'tickets.0': { $exists: true } });
        const admins = await User.find({ role: { $in: ['Super Admin', 'Admin'] } });
        const adminIds = admins.map(a => a._id.toString());
        
        const today = new Date();
        const notificationPromises = [];

        candidates.forEach(c => {
            (c.tickets || []).forEach(t => {
                if (!t.expdate) return;
                
                const expDate = new Date(t.expdate);
                const timeDiff = expDate.getTime() - today.getTime();
                const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                if (diffDays <= 7 && diffDays >= 0) {
                    const title = 'Ticket Expiring Soon';
                    const message = `${c.name}'s ticket (${t.ticketNo}) expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                    const path = `/candidates?id=${c._id}`;

                    // Set of user IDs who should receive this notification
                    const recipients = new Set(adminIds);
                    if (c.createdBy) {
                        recipients.add(c.createdBy.toString());
                    }

                    // Create a notification for each recipient
                    recipients.forEach(userId => {
                        notificationPromises.push(
                            // Optional: use an upsert/check logic to avoid duplicate daily notifications
                            // For simplicity, we just insert. A better approach is to check if a notification
                            // for this specific ticket and day already exists for this user.
                            Notification.findOneAndUpdate(
                                {
                                    recipient: userId,
                                    title,
                                    message,
                                    isRead: false
                                },
                                {
                                    recipient: userId,
                                    title,
                                    message,
                                    type: 'info',
                                    path
                                },
                                { upsert: true, new: true }
                            )
                        );
                    });
                }
            });
        });

        if (notificationPromises.length > 0) {
            await Promise.all(notificationPromises);
            console.log(`Generated ${notificationPromises.length} notifications for expiring tickets.`);
        }
    }
}

module.exports = new CronService();

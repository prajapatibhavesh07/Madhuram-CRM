let twilio;
try {
    twilio = require('twilio');
} catch (e) {
    console.warn('[TWILIO] Module not found. WhatsApp/SMS will be disabled.');
}

/**
 * Service to handle SMS and WhatsApp notifications via Twilio.
 */
class TwilioService {
    constructor() {
        this.client = null;
    }

    async getClient() {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const phone = process.env.TWILIO_PHONE_NUMBER;
        const whatsapp = process.env.TWILIO_WHATSAPP_NUMBER || phone;

        try {
            const Settings = require('../models/Settings');
            const settings = await Settings.findOne();
            
            const dbSid = settings?.apiKeys?.twilioSid || sid;
            const dbAuthToken = settings?.apiKeys?.twilioToken || authToken;
            const dbPhone = settings?.apiKeys?.twilioPhone || phone;
            const dbWhatsapp = settings?.apiKeys?.twilioPhone || whatsapp;

            if (dbSid && dbAuthToken && typeof twilio === 'function') {
                return {
                    client: twilio(dbSid, dbAuthToken),
                    phone: dbPhone,
                    whatsapp: dbWhatsapp
                };
            }
        } catch (error) {
            console.error('[TWILIO] Settings fetch error:', error.message);
        }

        if (sid && authToken && typeof twilio === 'function') {
            return {
                client: twilio(sid, authToken),
                phone: phone,
                whatsapp: whatsapp
            };
        }

        return null;
    }

    /**
     * Send SMS notification.
     * @param {String} to - Phone number in E.164 format
     * @param {String} message - Text message content
     */
    async sendSMS(to, message) {
        const config = await this.getClient();
        if (!config || !config.client) return;
        try {
            await config.client.messages.create({
                body: message,
                from: config.phone,
                to: to
            });
            console.log(`[TWILIO] SMS sent to ${to}`);
        } catch (error) {
            console.error('[TWILIO] SMS error:', error.message);
        }
    }

    /**
     * Send WhatsApp notification.
     * @param {String} to - WhatsApp number (e.g., whatsapp:+1234567890)
     * @param {String} message - Text message content
     */
    async sendWhatsApp(to, message) {
        const config = await this.getClient();
        if (!config || !config.client) return;
        try {
            // Twilio Requires WhatsApp numbers to be prefixed with 'whatsapp:'
            const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
            const formattedFrom = config.whatsapp.startsWith('whatsapp:') ? config.whatsapp : `whatsapp:${config.whatsapp}`;

            await config.client.messages.create({
                body: message,
                from: formattedFrom,
                to: formattedTo
            });
            console.log(`[TWILIO] WhatsApp sent to ${to}`);
        } catch (error) {
            console.error('[TWILIO] WhatsApp error:', error.message);
        }
    }
}

module.exports = new TwilioService();

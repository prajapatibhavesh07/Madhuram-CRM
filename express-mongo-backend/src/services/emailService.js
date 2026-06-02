const nodemailer = require('nodemailer');

const Settings = require("../models/Settings");

const getTransporter = async () => {
    const settings = await Settings.findOne();
    const config = settings?.smtp || {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    };

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port == 465 || config.encryption === 'SSL',
        auth: {
            user: config.username || config.user, // Handle both DB and Env keys
            pass: config.password || config.pass,
        },
    });
};

/**
 * Replace placeholders in template with candidate data
 * @param {string} template 
 * @param {object} candidate 
 * @returns {string}
 */
const parseTemplate = (template, candidate) => {
    let content = template;
    const tags = {
        '@name': candidate.name || '',
        '@email': candidate.email || '',
        '@phone': candidate.phone || '',
        '@designation': candidate.designation || '',
        '@company': candidate.currentCompany || '',
        '@location': candidate.location || '',
    };

    Object.keys(tags).forEach(tag => {
        const regex = new RegExp(tag, 'g');
        content = content.replace(regex, tags[tag]);
    });

    return content;
};

/**
 * Send email to a single candidate
 * @param {object} candidate 
 * @param {string} subject 
 * @param {string} template 
 */
const sendEmail = async (candidate, subject, template) => {
    const htmlContent = parseTemplate(template, candidate);
    const settings = await Settings.findOne();
    const fromAddress = settings?.smtp?.from || process.env.SMTP_FROM;

    const mailOptions = {
        from: fromAddress,
        to: candidate.email,
        subject: parseTemplate(subject, candidate),
        html: htmlContent.replace(/\n/g, '<br>'), // Simple text to HTML conversion
    };

    const transporter = await getTransporter();
    return transporter.sendMail(mailOptions);
};

/**
 * Send bulk emails
 * @param {Array} candidates 
 * @param {string} subject 
 * @param {string} template 
 */
const sendBulkEmails = async (candidates, subject, template) => {
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };

    for (const candidate of candidates) {
        try {
            await sendEmail(candidate, subject, template);
            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push({ email: candidate.email, error: error.message });
            console.error(`Failed to send email to ${candidate.email}:`, error);
        }
    }

    return results;
};

/**
 * Send raw HTML email to any address
 * @param {string} toAddress 
 * @param {string} subject 
 * @param {string} htmlContent 
 */
const sendRawEmail = async (toAddress, subject, htmlContent) => {
    const settings = await Settings.findOne();
    const fromAddress = settings?.smtp?.from || process.env.SMTP_FROM;

    const mailOptions = {
        from: fromAddress,
        to: toAddress,
        subject: subject,
        html: htmlContent,
    };

    const transporter = await getTransporter();
    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendEmail,
    sendBulkEmails,
    sendRawEmail,
    parseTemplate
};

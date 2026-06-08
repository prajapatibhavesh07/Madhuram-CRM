const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['Email', 'WhatsApp'], default: 'Email', required: true },
    subject: { type: String }, // For email templates
    body: { type: String, required: true },
    isAiGenerated: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Template', templateSchema);

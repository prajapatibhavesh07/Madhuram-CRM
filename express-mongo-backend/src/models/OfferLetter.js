const mongoose = require('mongoose');

const offerLetterSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    issuedDate: { type: Date, default: Date.now },
    joiningDate: { type: Date, required: true },
    salary: {
        ctc: { type: Number, required: true },
        breakdown: { type: String } // JSON string or text description
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Revoked'],
        default: 'Draft'
    },
    content: { type: String }, // HTML content or link to PDF
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('OfferLetter', offerLetterSchema);

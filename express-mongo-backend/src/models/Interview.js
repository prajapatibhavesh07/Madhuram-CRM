const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    title: { type: String },
    endDate: { type: Date },
    isAllDay: { type: Boolean, default: false },
    color: { type: String },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, required: true },
    mode: {
        type: String,
        enum: ['Face to Face', 'Phone', 'Video'],
        default: 'Video'
    },
    status: {
        type: String,
        default: 'Pending'
    },
    stage: {
        type: String,
        default: 'Applied'
    },
    stageHistory: {
        type: Map,
        of: String,
        default: {}
    },
    companyName: { type: String },
    offers: { type: String, enum: ['Yes', 'No'], default: 'No' },
    shortlisted: { type: String, enum: ['Yes', 'No'], default: 'No' },
    feedback: { type: String },
    meetingLink: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPinned: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);

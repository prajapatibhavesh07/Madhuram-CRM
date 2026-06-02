const mongoose = require("mongoose");

const callHistorySchema = new mongoose.Schema(
    {
        date: { type: Date, default: Date.now },
        name: { type: String, required: true }, // The contact/person name
        candidateName: { type: String }, // Optional link to candidate
        phone: { type: String, required: true },
        companyName: { type: String },
        profileName: { type: String },
        ctc: { type: String },
        experience: { type: String },
        location: { type: String },
        remark: { type: String },
        // Mobile integration fields
        duration: { type: Number }, // in seconds
        recordingUrl: { type: String }, 
        callStartTime: { type: Date },
        callType: { type: String, enum: ['Incoming', 'Outgoing', 'Missed'], default: 'Outgoing' },
        status: { type: String, enum: ['Connected', 'Not Picked', 'Busy', 'Switch Off', 'Pending'], default: 'Connected' },
        // Linking logic (optional reference if match found)
        candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
        linkedEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        isPinned: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("CallHistory", callHistorySchema);

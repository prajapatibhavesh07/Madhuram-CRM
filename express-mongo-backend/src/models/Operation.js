const mongoose = require("mongoose");

const operationSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    companies: [{ type: String }],
    date: { type: Date, required: true },
    verify: { type: String, enum: ['Yes', 'No'], default: 'No' },
    noPoachInCV: { type: String, enum: ['Yes', 'No'], default: 'No' },
    removeNoPoach: { type: String, enum: ['Yes', 'No'], default: 'No' },
    readyToMove: { type: String, enum: ['Yes', 'No'], default: 'No' },
    vehicle: { type: String, enum: ['Yes', 'No'], default: 'No' },
    graduation: { type: String, enum: ['Yes', 'No'], default: 'No' },
    degreeCertificate: { type: String, enum: ['Yes', 'No'], default: 'No' },
    rehiring: { type: String, enum: ['Yes', 'No'], default: 'No' },
    remark: { type: String },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model("Operation", operationSchema);

const mongoose = require("mongoose");

const operationSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    companies: [{ type: String }],
    date: { type: Date, required: true },
    verify: { type: String, enum: ['Yes', 'No', ''], default: '' },
    noPoachInCV: { type: String, enum: ['Yes', 'No', ''], default: '' },
    removeNoPoach: { type: String, enum: ['Yes', 'No', ''], default: '' },
    readyToMove: { type: String, enum: ['Yes', 'No', ''], default: '' },
    vehicle: { type: String, enum: ['Yes', 'No', ''], default: '' },
    graduation: { type: String, enum: ['Yes', 'No', ''], default: '' },
    degreeCertificate: { type: String, enum: ['Yes', 'No', ''], default: '' },
    rehiring: { type: String, enum: ['Yes', 'No', ''], default: '' },
    remark: { type: String },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model("Operation", operationSchema);

const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    ticketNo: { type: String },
    companyName: { type: String },
    uploaddate: { type: String },
    expdate: { type: String },
    crtdate: { type: String },
    type: {
        type: String,
        default: 'Banca'
    },
    portalStatus: {
        type: String,
        enum: ['Completed', 'Pending', 'Duplicate'],
        default: 'Pending'
    }
});


const candidateSchema = new mongoose.Schema({
    // Basic Information
    name: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dob: { type: Date, required: true },
    age: { type: Number, required: true },
    phone: { type: String, required: true, unique: true, sparse: true },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true, unique: true, sparse: true },
    location: { type: String, required: true },
    prLocation: { type: String },

    // Professional Details
    currentCompany: String,
    currentProfile: String,
    designation: String,
    currentCTC: Number,
    noticePeriod: String,
    channel: { type: String, enum: ["Banca", "Agency", "Direct", "Referral", "Internal", "Job Portal", "Other"] },
    sector: { type: String, enum: ["BFSI", "Insurance", "Banking", "IT", "Service", "EdTech", "Manufacturing", "Other"] },
    totalWorkExp: Number,
    totalSalesExp: Number,
    bfsiExp: Number,

    // Education & Identity
    qualification: { type: String },
    pan: { type: String, required: true },

    // Assessment
    assessment: { type: String, enum: ["Selected", "Hold", "Rejected", "In Progress", "Clear", "Not Clear", "Pending"], default: "In Progress" },
    remark: String,

    // Tickets (Repeatable)
    tickets: [ticketSchema],

    // Documents
    resume: {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        mimeType: String
    },
    photograph: {
        fileName: String,
        fileUrl: String
    },
    panCard: {
        fileName: String,
        fileUrl: String
    },
    aadhaarCard: {
        fileName: String,
        fileUrl: String
    },
    educationProof: {
        fileName: String,
        fileUrl: String
    },
    offerLetter: {
        fileName: String,
        fileUrl: String
    },
    relativeLetter: {
        fileName: String,
        fileUrl: String
    },
    salarySlip: {
        fileName: String,
        fileUrl: String
    },
    cheque: {
        fileName: String,
        fileUrl: String
    },
    signature: {
        fileName: String,
        fileUrl: String
    },

    // Onboarding Fields
    offerStatus: { type: String, enum: ['Accepted', 'Rejected', 'Pending'], default: 'Pending' },
    isResigned: { type: String, enum: ['Yes', 'No'], default: 'No' },
    resignationLetter: {
        fileName: String,
        fileUrl: String
    },
    doj: { type: Date },

    // ATS Fields
    applicationId: { type: String, unique: true },
    leadTag: { type: String, default: 'Jobseeker' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    recruitmentStatus: {
        type: String,
        enum: ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Rejected', 'Joined'],
        default: 'Applied'
    },
    timeline: [{
        status: String,
        date: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive
    isApproved: { type: Boolean, default: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },

    // AI Fields
    aiScore: { type: Number, default: 0 },
    aiSummary: { type: String },
    aiMatchBasis: { type: Object }, // Store detailed fit analysis
    extractedSkills: [String],
    extractedExperience: [{
        title: String,
        companyName: String,
        employmentType: String,
        location: String,
        salary: Number,
        currentlyWorking: Boolean,
        startDate: String,
        endDate: String,
        description: String
    }],
    extractedEducation: [{
        schoolName: String,
        qualification: String,
        specialization: String,
        grade: String,
        location: String,
        startDate: String,
        endDate: String,
        description: String
    }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedOperationManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: [{
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        isPinned: { type: Boolean, default: false }
    }],
    
    // Operations Tab Data
    dateFiled: { type: String },
    companyMulti: [{ type: String }],
    operationRemark: { type: String },
    fulfillmentChecklist: {
        verifyField: { type: String, enum: ['Yes', 'No', ''], default: '' },
        noPoachInCV: { type: String, enum: ['Yes', 'No', ''], default: '' },
        removeNoPoach: { type: String, enum: ['Yes', 'No', ''], default: '' },
        readyToMove: { type: String, enum: ['Yes', 'No', ''], default: '' },
        vehicle: { type: String, enum: ['Yes', 'No', ''], default: '' },
        graduation: { type: String, enum: ['Yes', 'No', ''], default: '' },
        degreeCertificate: { type: String, enum: ['Yes', 'No', ''], default: '' },
        rehiring: { type: String, enum: ['Yes', 'No', ''], default: '' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Candidate", candidateSchema);

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    // Basic Details
    logo: { type: String }, // Path to company logo
    date: { type: Date, default: Date.now },
    company: { type: String },
    title: { type: String },
    description: { type: String },
    department: { type: String },
    status: {
        type: String,
        enum: ['Open', 'Closed', 'Draft', 'Hold'],
        default: 'Open'
    },
    location: { type: String, required: true },
    branch: { type: String },
    
    // Managers (Repeated Section)
    managers: [{
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        
        // Job Details (Manager-specific)
        title: { type: String }, // Maps to 'Designation' in UI
        department: { type: String },
        channel: { type: String },
        openPosition: { type: String },
        noOfCandidates: { type: String },
        status: {
            type: String,
            enum: ['Open', 'Closed', 'Draft', 'Hold'],
            default: 'Open'
        },
        expiryDays: { type: String },
        crtDays: { type: String },
        ctc: { type: String },
        description: { type: String },
        fls: { type: String },
        nfls: { type: String },
        
        // Vacancy Questions (Manager-specific)
        vacancyQuestions: [{
            question: { type: String },
            questionType: { 
                type: String, 
                enum: ['options', 'dropdown', 'text'],
                default: 'text'
            },
            options: [String]
        }]
    }],

    // Metadata
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Legacy fields (kept temporarily for transition)
    salaryRange: {
        min: Number,
        max: Number,
        currency: { type: String, default: 'INR' }
    },
    requirements: [String],
    type: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
        default: 'Full-time'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);


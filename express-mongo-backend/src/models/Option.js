const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: [
                'currentCompany', 'currentProfile', 'designation', 'sector', 'channel', 
                'ticketCompany', 'ticketType', 'qualification', 'noticePeriod',
                'leadTag', 'recruitmentStatus', 'jobTitle', 'assessmentStatus'
            ],
            trim: true
        },
        value: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true }
);

// Ensure unique value per category
optionSchema.index({ category: 1, value: 1 }, { unique: true });

module.exports = mongoose.model("Option", optionSchema);

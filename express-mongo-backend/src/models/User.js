const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            default: "Normal User"
        },
        customRoleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        teamLeadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        },
        isOnline: {
            type: Boolean,
            default: false
        },
        employeeId: {
            type: String,
            unique: true,
            sparse: true
        },
        department: {
            type: String
        },
        designation: {
            type: String
        },
        joiningDate: {
            type: Date
        },
        dob: {
            type: Date
        },
        profilePhoto: {
            type: String
        },
        phone: {
            type: String,
            unique: true,
            sparse: true
        },
        panCard: {
            type: String
        },
        accountNo: {
            type: String
        },
        ifscCode: {
            type: String
        },
        bankName: {
            type: String
        },
        upiId: {
            type: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

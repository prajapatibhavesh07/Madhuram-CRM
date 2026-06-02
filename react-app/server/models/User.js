import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Super Admin', 'Admin', 'Manager', 'Editor'],
        default: 'Editor'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    lastLogin: {
        type: Date,
        default: null
    },
    profileImage: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;

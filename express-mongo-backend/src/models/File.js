const mongoose = require('mongoose');

const fileVersionSchema = new mongoose.Schema({
    versionNumber: {
        type: Number,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    note: {
        type: String,
        trim: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    currentVersion: {
        type: Number,
        default: 1
    },
    versions: [fileVersionSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for searching by folder and name
fileSchema.index({ folder: 1, name: 1 });
// Index for searching by tags
fileSchema.index({ tags: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;

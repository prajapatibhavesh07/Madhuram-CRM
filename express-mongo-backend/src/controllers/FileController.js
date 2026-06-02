const File = require('../models/File');
const path = require('path');
const fs = require('fs');

exports.uploadFile = async (req, res) => {
    try {
        const { name, folderId, tags, note } = req.body;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const fileUrl = `/uploads/documents/${req.file.filename}`;

        const file = new File({
            name: name || req.file.originalname,
            folder: folderId,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            createdBy: req.user.id,
            versions: [{
                versionNumber: 1,
                fileUrl,
                note: note || 'Initial upload',
                uploadedBy: req.user.id
            }]
        });

        await file.save();
        res.status(201).json(file);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.uploadNewVersion = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const file = await File.findById(id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        const newVersionNumber = file.currentVersion + 1;
        const fileUrl = `/uploads/documents/${req.file.filename}`;

        file.versions.push({
            versionNumber: newVersionNumber,
            fileUrl,
            note: note || `Version ${newVersionNumber} update`,
            uploadedBy: req.user.id
        });

        file.currentVersion = newVersionNumber;
        await file.save();

        res.status(200).json(file);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getFiles = async (req, res) => {
    try {
        const { folderId, tag } = req.query;
        let query = { isDeleted: false };
        if (folderId) query.folder = folderId;
        if (tag) query.tags = tag;

        const files = await File.find(query).populate('createdBy', 'name');
        res.status(200).json(files);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await File.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!file) return res.status(404).json({ message: 'File not found' });
        res.status(200).json({ message: 'File deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.addTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { tag } = req.body;
        const file = await File.findByIdAndUpdate(
            id,
            { $addToSet: { tags: tag } },
            { new: true }
        );
        res.status(200).json(file);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.removeTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { tag } = req.body;
        const file = await File.findByIdAndUpdate(
            id,
            { $pull: { tags: tag } },
            { new: true }
        );
        res.status(200).json(file);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const Folder = require('../models/Folder');
const File = require('../models/File');

exports.createFolder = async (req, res) => {
    try {
        const { name, parentFolder } = req.body;
        const folder = new Folder({
            name,
            parentFolder: parentFolder || null,
            createdBy: req.user.id
        });
        await folder.save();
        res.status(201).json(folder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getFolders = async (req, res) => {
    try {
        const { parentFolder } = req.query;
        const query = { 
            parentFolder: parentFolder || null, 
            isDeleted: false 
        };
        const folders = await Folder.find(query).populate('createdBy', 'name');
        res.status(200).json(folders);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const folder = await Folder.findByIdAndUpdate(id, { name }, { new: true });
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        res.status(200).json(folder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteFolder = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if folder has subfolders or files
        const subfolders = await Folder.countDocuments({ parentFolder: id, isDeleted: false });
        const files = await File.countDocuments({ folder: id, isDeleted: false });

        if (subfolders > 0 || files > 0) {
            return res.status(400).json({ message: 'Cannot delete folder containing files or subfolders' });
        }

        const folder = await Folder.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        res.status(200).json({ message: 'Folder deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const Template = require('../models/Template');

exports.createTemplate = async (req, res) => {
    try {
        const { name, type, subject, body, isAiGenerated } = req.body;
        if (!name || !type || !body) {
            return res.status(400).json({ error: 'Name, type, and body are required' });
        }
        const template = new Template({ name, type, subject, body, isAiGenerated });
        await template.save();
        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTemplates = async (req, res) => {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTemplateById = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { name, type, subject, body, isAiGenerated } = req.body;
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ error: 'Template not found' });
        
        if (name !== undefined) template.name = name;
        if (type !== undefined) template.type = type;
        if (subject !== undefined) template.subject = subject;
        if (body !== undefined) template.body = body;
        if (isAiGenerated !== undefined) template.isAiGenerated = isAiGenerated;
        
        await template.save();
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

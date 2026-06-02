const Option = require("../models/Option");

exports.getOptions = async (req, res) => {
    try {
        const options = await Option.find().sort({ value: 1 });
        // Group by category for easier frontend use
        const grouped = options.reduce((acc, opt) => {
            if (!acc[opt.category]) acc[opt.category] = [];
            acc[opt.category].push(opt.value);
            return acc;
        }, {});
        res.json(grouped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addOption = async (req, res) => {
    const { category, value } = req.body;
    try {
        // Check if exists
        const existing = await Option.findOne({ category, value: { $regex: new RegExp(`^${value}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ message: "Option already exists" });
        }

        const newOption = new Option({ category, value });
        await newOption.save();
        res.status(201).json(newOption);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

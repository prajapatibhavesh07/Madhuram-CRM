const Option = require("../models/Option");
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");

exports.getOptions = async (req, res) => {
    try {
        let options = await Option.find().sort({ value: 1 });

        // If no options exist in DB at all, auto-seed default system option values
        if (options.length === 0) {
            const defaults = [
                // Sectors
                { category: 'sector', value: 'BFSI' },
                { category: 'sector', value: 'Insurance' },
                { category: 'sector', value: 'Banking' },
                { category: 'sector', value: 'IT' },
                { category: 'sector', value: 'Service' },
                { category: 'sector', value: 'EdTech' },
                { category: 'sector', value: 'Manufacturing' },
                { category: 'sector', value: 'Other' },
                // Channels
                { category: 'channel', value: 'Banca' },
                { category: 'channel', value: 'Agency' },
                { category: 'channel', value: 'Direct' },
                { category: 'channel', value: 'Referral' },
                { category: 'channel', value: 'Internal' },
                { category: 'channel', value: 'Job Portal' },
                { category: 'channel', value: 'Other' },
                // Designations
                { category: 'designation', value: 'Manager' },
                { category: 'designation', value: 'Developer' },
                { category: 'designation', value: 'HR Recruiter' },
                { category: 'designation', value: 'Sales Executive' },
                // Notice periods
                { category: 'noticePeriod', value: 'Immediate' },
                { category: 'noticePeriod', value: '15 Days' },
                { category: 'noticePeriod', value: '30 Days' },
                { category: 'noticePeriod', value: '45 Days' },
                { category: 'noticePeriod', value: '60 Days' },
                { category: 'noticePeriod', value: '90 Days' },
                // Qualifications
                { category: 'qualification', value: 'Graduate' },
                { category: 'qualification', value: 'Post Graduate' },
                { category: 'qualification', value: 'Under Graduate' },
                { category: 'qualification', value: 'Doctorate' },
                { category: 'qualification', value: 'Diploma' },
                // Lead tags
                { category: 'leadTag', value: 'Jobseeker' },
                { category: 'leadTag', value: 'Lead' },
                { category: 'leadTag', value: 'Client' },
                { category: 'leadTag', value: 'Other' },
                // Recruitment Statuses
                { category: 'recruitmentStatus', value: 'Applied' },
                { category: 'recruitmentStatus', value: 'Shortlisted' },
                { category: 'recruitmentStatus', value: 'Interviewed' },
                { category: 'recruitmentStatus', value: 'Offered' },
                { category: 'recruitmentStatus', value: 'Rejected' },
                { category: 'recruitmentStatus', value: 'Joined' },
                // Assessment Statuses
                { category: 'assessmentStatus', value: 'Clear' },
                { category: 'assessmentStatus', value: 'Not Clear' },
                { category: 'assessmentStatus', value: 'Pending' }
            ];
            await Option.insertMany(defaults);
            options = await Option.find().sort({ value: 1 });
        }

        // Group by category for easier frontend use
        const grouped = options.reduce((acc, opt) => {
            if (!acc[opt.category]) acc[opt.category] = [];
            acc[opt.category].push(opt.value);
            return acc;
        }, {});

        // Ensure all categories return at least an empty array if not present in DB
        const allCategories = [
            'currentCompany', 'currentProfile', 'designation', 'sector', 'channel', 
            'ticketCompany', 'ticketType', 'qualification', 'noticePeriod',
            'leadTag', 'recruitmentStatus', 'jobTitle', 'assessmentStatus'
        ];
        allCategories.forEach(cat => {
            if (!grouped[cat]) grouped[cat] = [];
        });

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

exports.deleteOption = async (req, res) => {
    const { category, value } = req.body;
    try {
        const option = await Option.findOneAndDelete({ category, value });
        if (!option) {
            return res.status(404).json({ message: "Option not found" });
        }
        res.json({ message: "Option deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateOption = async (req, res) => {
    const { category, oldValue, newValue } = req.body;

    if (!category || !oldValue || !newValue) {
        return res.status(400).json({ message: "Category, oldValue, and newValue are required" });
    }

    try {
        // 1. Check if option with newValue already exists
        const existing = await Option.findOne({ category, value: { $regex: new RegExp(`^${newValue}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ message: "Option value already exists" });
        }

        // 2. Find and update the option document
        const option = await Option.findOneAndUpdate(
            { category, value: oldValue },
            { value: newValue },
            { new: true }
        );

        if (!option) {
            return res.status(404).json({ message: "Option not found" });
        }

        // 3. Propagate the change to Candidates and Jobs
        if (category === 'currentCompany') {
            await Candidate.updateMany({ currentCompany: oldValue }, { currentCompany: newValue });
        } else if (category === 'currentProfile') {
            await Candidate.updateMany({ currentProfile: oldValue }, { currentProfile: newValue });
        } else if (category === 'designation') {
            await Candidate.updateMany({ designation: oldValue }, { designation: newValue });
            await Job.updateMany({ title: oldValue }, { title: newValue });
            await Job.updateMany(
                { "managers.title": oldValue },
                { $set: { "managers.$[elem].title": newValue } },
                { arrayFilters: [{ "elem.title": oldValue }] }
            );
        } else if (category === 'sector') {
            await Candidate.updateMany({ sector: oldValue }, { sector: newValue });
        } else if (category === 'channel') {
            await Candidate.updateMany({ channel: oldValue }, { channel: newValue });
            await Job.updateMany(
                { "managers.channel": oldValue },
                { $set: { "managers.$[elem].channel": newValue } },
                { arrayFilters: [{ "elem.channel": oldValue }] }
            );
        } else if (category === 'qualification') {
            await Candidate.updateMany({ qualification: oldValue }, { qualification: newValue });
        } else if (category === 'noticePeriod') {
            await Candidate.updateMany({ noticePeriod: oldValue }, { noticePeriod: newValue });
        } else if (category === 'ticketCompany') {
            await Candidate.updateMany(
                { "tickets.companyName": oldValue },
                { $set: { "tickets.$[elem].companyName": newValue } },
                { arrayFilters: [{ "elem.companyName": oldValue }] }
            );
            await Job.updateMany({ company: oldValue }, { company: newValue });
        } else if (category === 'ticketType') {
            await Candidate.updateMany(
                { "tickets.type": oldValue },
                { $set: { "tickets.$[elem].type": newValue } },
                { arrayFilters: [{ "elem.type": oldValue }] }
            );
        }

        res.json({ message: "Option updated successfully", option });
    } catch (error) {
        console.error("Failed to update option:", error);
        res.status(500).json({ message: error.message });
    }
};

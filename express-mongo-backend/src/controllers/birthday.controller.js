const User = require("../models/User");
const Candidate = require("../models/Candidate");

// Helper to normalize data from both models
const normalizeBirthdayData = (items, type) => {
    return items.map(item => ({
        _id: item._id,
        name: item.name,
        email: item.email,
        phone: item.phone || item.whatsapp || "",
        dob: item.dob,
        profilePhoto: item.profilePhoto || (item.photograph ? item.photograph.fileUrl : null),
        role: type === "Employee" ? (item.role || "Team Member") : "Candidate",
        type: type // "Employee" or "Candidate"
    }));
};

// Get Today's Birthdays
exports.getTodaysBirthdays = async (req, res) => {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        const matchStage = {
            $match: {
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$dob" }, month] },
                        { $eq: [{ $dayOfMonth: "$dob" }, day] }
                    ]
                }
            }
        };

        const [users, candidates] = await Promise.all([
            User.aggregate([matchStage]),
            Candidate.aggregate([matchStage])
        ]);

        const normalizedUsers = normalizeBirthdayData(users, "Employee");
        const normalizedCandidates = normalizeBirthdayData(candidates, "Candidate");

        res.json([...normalizedUsers, ...normalizedCandidates]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Upcoming Birthdays (Next 30 days)
exports.getUpcomingBirthdays = async (req, res) => {
    try {
        const [users, candidates] = await Promise.all([
            User.find({ dob: { $exists: true } }).select("name email phone profilePhoto role dob"),
            Candidate.find({ dob: { $exists: true } }).select("name email phone whatsapp photograph dob")
        ]);

        const allPeople = [
            ...normalizeBirthdayData(users, "Employee"),
            ...normalizeBirthdayData(candidates, "Candidate")
        ];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = allPeople.map(person => {
            const dob = new Date(person.dob);
            const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            
            if (birthdayThisYear < today) {
                birthdayThisYear.setFullYear(today.getFullYear() + 1);
            }

            const diffTime = birthdayThisYear.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
                ...person,
                daysUntil: diffDays,
                nextBirthday: birthdayThisYear
            };
        })
        .filter(u => u.daysUntil > 0 && u.daysUntil <= 30) // Show next 30 days
        .sort((a, b) => a.daysUntil - b.daysUntil);

        res.json(upcoming);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

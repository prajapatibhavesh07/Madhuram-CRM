const Operation = require("../models/Operation");
const Candidate = require("../models/Candidate");

exports.createOperation = async (req, res) => {
    try {
        const { candidateId, tickets, ...operationData } = req.body;

        // If tickets are provided, we should add them to the candidate's tickets array
        if (tickets && tickets.length > 0) {
            await Candidate.findByIdAndUpdate(candidateId, {
                $push: { tickets: { $each: tickets } }
            });
        }

        // Upsert based on candidateId so a candidate only has one active Operation Desk assignment
        // If you want multiple history records, change this to a pure `create()`
        const operation = await Operation.findOneAndUpdate(
            { candidateId },
            {
                ...operationData,
                // We extract user id if middleware sets it, or fallback. 
                // Currently user ID is sent via headers in `api.ts` getHeaders()
                assignedBy: req.headers['user-id']
            },
            { new: true, upsert: true }
        );

        res.status(201).json(operation);
    } catch (error) {
        console.error("Error creating operation:", error);
        res.status(500).json({ message: "Failed to create operation assignment", error: error.message });
    }
};

exports.getOperations = async (req, res) => {
    try {
        const operations = await Operation.find()
            .populate('candidateId')
            .populate('assignedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(operations);
    } catch (error) {
        console.error("Error fetching operations:", error);
        res.status(500).json({ message: "Failed to fetch operations", error: error.message });
    }
};

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    dueDate: { type: Date },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Todo', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Todo'
    },
    reminderTime: { type: Date },
    subtasks: [
        {
            title: { type: String, required: true },
            isCompleted: { type: Boolean, default: false }
        }
    ],
    overdueNotified: { type: Boolean, default: false },
    reminderNotified: { type: Boolean, default: false },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);

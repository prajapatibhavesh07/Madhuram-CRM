const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');

exports.createTask = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Authentication required" });
        const task = new Task({
            ...req.body,
            createdBy: req.user._id
        });
        await task.save();

        // Audit Log
        await auditService.logAction(req, {
            action: 'CREATE',
            module: 'Task',
            targetId: task._id,
            targetModel: 'Task',
            details: `Task "${task.title}" created by ${req.user.name}`
        });

        // Advanced Notification
        await notificationService.sendNotification(task.assignedTo, {
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${task.title}`,
            type: 'task',
            path: '/tasks',
            channels: ['in-app', 'email']
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getTasks = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Authentication required" });
        const filters = {};
        const { role, _id } = req.user;

        // Role-based visibility logic
        if (role === 'Admin' || role === 'Super Admin') {
            // Can see everything
        } else if (role === 'Manager') {
            // See own tasks + tasks of users who have this managerId
            const User = require('../models/User');
            const subordinates = await User.find({ managerId: _id }).select('_id');
            const subordinateIds = subordinates.map(s => s._id);
            filters.$or = [
                { assignedTo: _id },
                { assignedTo: { $in: subordinateIds } }
            ];
        } else if (role === 'Team Lead') {
            // See own tasks + tasks of users who have this teamLeadId
            const User = require('../models/User');
            const subordinates = await User.find({ teamLeadId: _id }).select('_id');
            const subordinateIds = subordinates.map(s => s._id);
            filters.$or = [
                { assignedTo: _id },
                { assignedTo: { $in: subordinateIds } }
            ];
        } else {
            // Recruiter, HR, Normal User only see assigned tasks
            filters.assignedTo = _id;
        }

        // Apply additional query filters
        if (req.query.status) filters.status = req.query.status;
        if (req.query.priority) filters.priority = req.query.priority;
        if (req.query.assignedTo && (role === 'Admin' || role === 'Super Admin')) {
            filters.assignedTo = req.query.assignedTo;
        }

        const tasks = await Task.find(filters)
            .populate('assignedTo', 'name email role')
            .populate('candidate', 'name email')
            .populate('job', 'title company')
            .populate('createdBy', 'name email')
            .populate('dependencies', 'title status')
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('candidate', 'name email')
            .populate('job', 'title company')
            .populate('createdBy', 'name email')
            .populate('dependencies', 'title status');
        
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const oldTask = await Task.findById(req.params.id);
        if (!oldTask) return res.status(404).json({ message: 'Task not found' });

        // Dependency check: If completing, check if dependencies are finished
        if (req.body.status === 'Completed' && oldTask.status !== 'Completed') {
            const pendingDependencies = await Task.find({
                _id: { $in: oldTask.dependencies },
                status: { $ne: 'Completed' }
            });

            if (pendingDependencies.length > 0) {
                const depTitles = pendingDependencies.map(d => d.title).join(', ');
                return res.status(400).json({ 
                    message: `Cannot complete task. Pending dependencies: ${depTitles}` 
                });
            }
        }

        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('assignedTo', 'name email')
            .populate('dependencies', 'title status');
        
        const changes = auditService.detectChanges(oldTask, task);
        if (changes) {
            const isStatusChange = !!changes.status;
            const isAssignmentChange = !!changes.assignedTo;

            await auditService.logAction(req, {
                action: isStatusChange ? 'STATUS_CHANGE' : 'UPDATE',
                module: 'Task',
                targetId: task._id,
                targetModel: 'Task',
                changes,
                details: isStatusChange 
                    ? `Task status changed from ${changes.status.old} to ${changes.status.new}` 
                    : `Task "${task.title}" updated`
            });

            // Notify if assignedTo changed
            if (isAssignmentChange) {
                await notificationService.sendNotification(task.assignedTo, {
                    title: 'Task Reassigned',
                    message: `Task "${task.title}" has been reassigned to you.`,
                    type: 'task',
                    path: '/tasks',
                    channels: ['in-app', 'email']
                });
            }
        }

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        await auditService.logAction(req, {
            action: 'DELETE',
            module: 'Task',
            targetId: task._id,
            targetModel: 'Task',
            details: `Task "${task.title}" deleted`
        });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTaskComments = async (req, res) => {
    try {
        const comments = await TaskComment.find({ task: req.params.id })
            .populate('user', 'name email')
            .sort({ createdAt: 1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addTaskComment = async (req, res) => {
    try {
        const comment = new TaskComment({
            task: req.params.id,
            user: req.user._id,
            content: req.body.content
        });
        await comment.save();

        // Audit Log
        await auditService.logAction(req, {
            action: 'ADD_COMMENT',
            module: 'Task',
            targetId: req.params.id,
            targetModel: 'Task',
            details: `New comment added to task by ${req.user.name}`
        });

        // Notify assigned user if it's not the commenter
        const task = await Task.findById(req.params.id);
        if (task && task.assignedTo.toString() !== req.user._id.toString()) {
            await notificationService.sendNotification(task.assignedTo, {
                title: 'New Comment on Task',
                message: `${req.user.name} commented on: ${task.title}`,
                type: 'task',
                path: '/tasks',
                channels: ['in-app']
            });
        }

        res.status(201).json(comment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const AuditLog = require('../models/AuditLog');

/**
 * Service to handle audit logging across the application.
 */
class AuditService {
    /**
     * Log an action to the database.
     * @param {Object} req - Express request object (to extract user and context)
     * @param {Object} params - Logging parameters
     * @param {String} params.action - Action type (CREATE, UPDATE, DELETE, etc.)
     * @param {String} params.module - Affected module (User, Candidate, Task, etc.)
     * @param {String} params.targetId - ID of the affected record
     * @param {String} params.targetModel - Model name of the affected record
     * @param {Object} [params.changes] - Object containing old and new values
     * @param {String} [params.details] - Human-readable description
     */
    async logAction(req, { action, module, targetId, targetModel, changes, details }) {
        try {
            const logEntry = new AuditLog({
                user: req.user ? req.user._id : null,
                action,
                module,
                targetId,
                targetModel,
                changes,
                details,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            });

            await logEntry.save();
        } catch (error) {
            console.error('Failed to save audit log:', error);
            // We don't throw here to avoid breaking the main request flow
        }
    }

    /**
     * Helper to detect changes between two objects.
     * @param {Object} oldData - Original record data
     * @param {Object} newData - Updated record data
     * @param {Array} excludeFields - Fields to skip (e.g., updatedAt, __v)
     * @returns {Object|null} Map of changes or null if no differences
     */
    detectChanges(oldData, newData, excludeFields = ['updatedAt', '__v', 'updatedBy']) {
        const changes = {};
        const oldObj = oldData.toObject ? oldData.toObject() : oldData;
        const newObj = newData.toObject ? newData.toObject() : newData;

        Object.keys(newObj).forEach(key => {
            if (excludeFields.includes(key)) return;
            
            const oldVal = JSON.stringify(oldObj[key]);
            const newVal = JSON.stringify(newObj[key]);

            if (oldVal !== newVal) {
                changes[key] = {
                    old: oldObj[key],
                    new: newObj[key]
                };
            }
        });

        return Object.keys(changes).length > 0 ? changes : null;
    }
}

module.exports = new AuditService();

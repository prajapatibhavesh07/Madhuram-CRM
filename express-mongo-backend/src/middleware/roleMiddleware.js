const User = require("../models/User");
const Role = require("../models/Role");

const MODULE_PERMISSIONS = {
    dashboard: { roles: ['Super Admin', 'Admin', 'HR', 'Manager', 'Operation Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    candidates: { roles: ['Super Admin', 'Admin', 'Manager', 'Operation Manager', 'Team Lead', 'Recruiter'] },
    jobs: { roles: ['Super Admin', 'Admin', 'Manager', 'Operation Manager', 'Team Lead', 'Recruiter'] },
    operations: { roles: ['Super Admin', 'Admin', 'Manager', 'Operation Manager', 'Team Lead', 'Recruiter'] },
    tasks: { roles: ['Super Admin', 'Admin', 'Manager', 'Operation Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    callHistory: { roles: ['Super Admin', 'Admin', 'Manager', 'Operation Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    offers: { roles: ['Super Admin', 'Admin', 'Manager', 'Operation Manager'] },
    users: { roles: ['Super Admin', 'Admin', 'Manager'] },
    attendance: { roles: ['Super Admin', 'Admin', 'HR', 'Manager', 'Operation Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    leaves: { roles: ['Super Admin', 'Admin', 'HR', 'Manager', 'Operation Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    payroll: { roles: ['Super Admin', 'Admin', 'HR', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    fileManager: { roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    importExport: { roles: ['Super Admin', 'Admin', 'Operation Manager'] },
    settings: { roles: ['Super Admin', 'Admin'] },
    birthdays: { roles: ['Super Admin', 'Admin', 'HR', 'Manager', 'Operation Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    roles: { roles: ['Super Admin', 'Admin'] }
};

const BUILT_IN_PERMISSIONS = {
    'Super Admin': Object.fromEntries(
        Object.keys(MODULE_PERMISSIONS).map(m => [m, { view: true, create: true, edit: true, delete: true }])
    ),
    'Admin': Object.fromEntries(
        Object.keys(MODULE_PERMISSIONS).map(m => [m, { view: true, create: true, edit: true, delete: true }])
    ),
    'HR': {
        dashboard: { view: true, create: false, edit: false, delete: false },
        candidates: { view: false, create: false, edit: false, delete: false },
        jobs: { view: false, create: false, edit: false, delete: false },
        operations: { view: false, create: false, edit: false, delete: false },
        tasks: { view: false, create: false, edit: false, delete: false },
        callHistory: { view: false, create: false, edit: false, delete: false },
        offers: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        attendance: { view: true, create: false, edit: false, delete: false },
        leaves: { view: true, create: true, edit: true, delete: true },
        payroll: { view: true, create: false, edit: false, delete: false },
        fileManager: { view: false, create: false, edit: false, delete: false },
        importExport: { view: false, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        birthdays: { view: true, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false }
    },
    'Manager': {
        dashboard: { view: true, create: false, edit: false, delete: false },
        candidates: { view: true, create: false, edit: true, delete: false },
        jobs: { view: true, create: false, edit: true, delete: false },
        operations: { view: true, create: false, edit: true, delete: false },
        tasks: { view: true, create: true, edit: true, delete: true },
        callHistory: { view: true, create: false, edit: false, delete: false },
        offers: { view: true, create: false, edit: false, delete: false },
        users: { view: true, create: false, edit: false, delete: false },
        attendance: { view: true, create: false, edit: false, delete: false },
        leaves: { view: true, create: false, edit: true, delete: false },
        payroll: { view: true, create: false, edit: false, delete: false },
        fileManager: { view: true, create: false, edit: false, delete: false },
        importExport: { view: false, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        birthdays: { view: true, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false }
    },
    'Operation Manager': {
        dashboard: { view: true, create: false, edit: false, delete: false },
        candidates: { view: true, create: false, edit: true, delete: false },
        jobs: { view: true, create: false, edit: true, delete: false },
        operations: { view: true, create: false, edit: true, delete: false },
        tasks: { view: true, create: true, edit: true, delete: true },
        callHistory: { view: true, create: false, edit: false, delete: false },
        offers: { view: true, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        attendance: { view: true, create: false, edit: false, delete: false },
        leaves: { view: true, create: false, edit: true, delete: false },
        payroll: { view: false, create: false, edit: false, delete: false },
        fileManager: { view: false, create: false, edit: false, delete: false },
        importExport: { view: true, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        birthdays: { view: true, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false }
    },
    'Team Lead': {
        dashboard: { view: true, create: false, edit: false, delete: false },
        candidates: { view: true, create: false, edit: true, delete: false },
        jobs: { view: true, create: false, edit: false, delete: false },
        operations: { view: true, create: false, edit: true, delete: false },
        tasks: { view: true, create: true, edit: true, delete: true },
        callHistory: { view: true, create: false, edit: false, delete: false },
        offers: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        attendance: { view: true, create: false, edit: false, delete: false },
        leaves: { view: true, create: false, edit: false, delete: false },
        payroll: { view: true, create: false, edit: false, delete: false },
        fileManager: { view: true, create: false, edit: false, delete: false },
        importExport: { view: false, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        birthdays: { view: true, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false }
    },
    'Recruiter': {
        dashboard: { view: true, create: false, edit: false, delete: false },
        candidates: { view: true, create: true, edit: true, delete: false },
        jobs: { view: true, create: false, edit: false, delete: false },
        operations: { view: true, create: false, edit: true, delete: false },
        tasks: { view: true, create: true, edit: true, delete: false },
        callHistory: { view: true, create: true, edit: false, delete: false },
        offers: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        attendance: { view: true, create: false, edit: false, delete: false },
        leaves: { view: true, create: false, edit: false, delete: false },
        payroll: { view: true, create: false, edit: false, delete: false },
        fileManager: { view: true, create: false, edit: false, delete: false },
        importExport: { view: false, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        birthdays: { view: true, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false }
    },
    'Normal User': {
        dashboard: { view: true, create: false, edit: false, delete: false },
        candidates: { view: false, create: false, edit: false, delete: false },
        jobs: { view: false, create: false, edit: false, delete: false },
        operations: { view: false, create: false, edit: false, delete: false },
        tasks: { view: true, create: true, edit: true, delete: false },
        callHistory: { view: true, create: false, edit: false, delete: false },
        offers: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        attendance: { view: true, create: false, edit: false, delete: false },
        leaves: { view: true, create: false, edit: false, delete: false },
        payroll: { view: true, create: false, edit: false, delete: false },
        fileManager: { view: true, create: false, edit: false, delete: false },
        importExport: { view: false, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        birthdays: { view: true, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false }
    }
};

const getModuleNameFromUrl = (baseUrl) => {
    if (!baseUrl) return null;
    if (baseUrl.includes('/candidates')) return 'candidates';
    if (baseUrl.includes('/jobs')) return 'jobs';
    if (baseUrl.includes('/operations')) return 'operations';
    if (baseUrl.includes('/tasks')) return 'tasks';
    if (baseUrl.includes('/call-history') || baseUrl.includes('/chat')) return 'callHistory';
    if (baseUrl.includes('/offers')) return 'offers';
    if (baseUrl.includes('/users')) return 'users';
    if (baseUrl.includes('/attendance')) return 'attendance';
    if (baseUrl.includes('/leaves')) return 'leaves';
    if (baseUrl.includes('/payroll')) return 'payroll';
    if (baseUrl.includes('/files') || baseUrl.includes('/folders')) return 'fileManager';
    if (baseUrl.includes('/settings')) return 'settings';
    if (baseUrl.includes('/roles')) return 'roles';
    if (baseUrl.includes('/dashboard')) return 'dashboard';
    return null;
};

const getActionFromMethod = (method) => {
    const m = method.toUpperCase();
    if (m === 'GET') return 'view';
    if (m === 'POST') return 'create';
    if (m === 'PUT' || m === 'PATCH') return 'edit';
    if (m === 'DELETE') return 'delete';
    return 'view';
};

const getUserPermissions = async (user) => {
    if (!user) return null;

    if (user.customRoleId) {
        try {
            const role = await Role.findById(user.customRoleId);
            if (role) {
                const permissions = {};
                const permissionsObj = role.permissions.toJSON ? role.permissions.toJSON() : role.permissions;
                for (const [key, value] of Object.entries(permissionsObj)) {
                    permissions[key] = value;
                }
                return permissions;
            }
        } catch (error) {
            console.error('Error fetching custom role:', error);
        }
    }

    // Fallback: Check if there is an edited built-in role in the database
    try {
        const role = await Role.findOne({ name: user.role });
        if (role) {
            const permissions = {};
            const permissionsObj = role.permissions.toJSON ? role.permissions.toJSON() : role.permissions;
            for (const [key, value] of Object.entries(permissionsObj)) {
                permissions[key] = value;
            }
            return permissions;
        }
    } catch (error) {
        console.error('Error fetching built-in role from database:', error);
    }

    return BUILT_IN_PERMISSIONS[user.role] || null;
};

const authorize = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized: No user found" });
            }

            const isAdmin = req.user.role === 'Super Admin' || req.user.role === 'Admin';

            if (!isAdmin) {
                // First verify if the role is allowed at all on this endpoint
                if (!allowedRoles.includes(req.user.role)) {
                    return res.status(403).json({ message: `Forbidden: Access denied for role ${req.user.role}` });
                }

                // Check specific module and action permissions
                const permissions = await getUserPermissions(req.user);
                const moduleName = getModuleNameFromUrl(req.baseUrl);
                const action = getActionFromMethod(req.method);

                if (moduleName && permissions && permissions[moduleName]) {
                    if (!permissions[moduleName][action]) {
                        return res.status(403).json({ message: `Forbidden: Access denied for role ${req.user.role} on ${moduleName} for action ${action}` });
                    }
                } else {
                    return res.status(403).json({ message: `Forbidden: Access denied for role ${req.user.role} (no module permissions)` });
                }
            }

            const permissions = await getUserPermissions(req.user);
            req.userPermissions = permissions;

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({ message: 'Authorization failed' });
        }
    };
};

const authorizeModule = (moduleName, action = 'view') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized: No user found" });
            }

            const isAdmin = req.user.role === 'Super Admin' || req.user.role === 'Admin';
            const permissions = await getUserPermissions(req.user);

            if (!isAdmin) {
                if (!permissions || !permissions[moduleName]) {
                    return res.status(403).json({ message: `Forbidden: No access to ${moduleName}` });
                }

                if (!permissions[moduleName][action]) {
                    return res.status(403).json({ message: `Forbidden: Cannot ${action} ${moduleName}` });
                }
            }

            req.userPermissions = permissions;
            next();
        } catch (error) {
            console.error('Module authorization error:', error);
            res.status(500).json({ message: 'Module authorization failed' });
        }
    };
};

const getSubordinateIds = async (userId) => {
    try {
        let allSubordinateIds = [];
        let currentLevelIds = [userId];

        while (currentLevelIds.length > 0) {
            const subordinates = await User.find({
                $or: [
                    { managerId: { $in: currentLevelIds } },
                    { teamLeadId: { $in: currentLevelIds } }
                ],
                _id: { $nin: [userId, ...allSubordinateIds] }
            }).select('_id');

            if (subordinates.length === 0) {
                break;
            }

            const nextLevelIds = subordinates.map(s => s._id);
            allSubordinateIds = allSubordinateIds.concat(nextLevelIds);
            currentLevelIds = nextLevelIds;
        }

        return allSubordinateIds;
    } catch (error) {
        console.error('Error fetching subordinate IDs:', error);
        return [];
    }
};

module.exports = authorize;
module.exports.authorizeModule = authorizeModule;
module.exports.getUserPermissions = getUserPermissions;
module.exports.BUILT_IN_PERMISSIONS = BUILT_IN_PERMISSIONS;
module.exports.MODULE_PERMISSIONS = MODULE_PERMISSIONS;
module.exports.getSubordinateIds = getSubordinateIds;

const User = require("../models/User");
const Role = require("../models/Role");

const MODULE_PERMISSIONS = {
    dashboard: { roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    candidates: { roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter'] },
    jobs: { roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter'] },
    operations: { roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter'] },
    tasks: { roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    callHistory: { roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    offers: { roles: ['Super Admin', 'Admin', 'Manager', 'HR'] },
    users: { roles: ['Super Admin', 'Admin'] },
    attendance: { roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    leaves: { roles: ['Super Admin', 'Admin', 'HR', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    payroll: { roles: ['Super Admin', 'Admin', 'HR', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    fileManager: { roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
    importExport: { roles: ['Super Admin', 'Admin'] },
    settings: { roles: ['Super Admin', 'Admin'] },
    birthdays: { roles: ['Super Admin', 'Admin', 'HR', 'Manager', 'Team Lead', 'Recruiter', 'Normal User'] },
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
        candidates: { view: true, create: true, edit: true, delete: false },
        jobs: { view: true, create: false, edit: false, delete: false },
        operations: { view: false, create: false, edit: false, delete: false },
        tasks: { view: true, create: true, edit: true, delete: false },
        callHistory: { view: true, create: false, edit: false, delete: false },
        offers: { view: true, create: true, edit: true, delete: true },
        users: { view: false, create: false, edit: false, delete: false },
        attendance: { view: true, create: false, edit: false, delete: false },
        leaves: { view: true, create: true, edit: true, delete: true },
        payroll: { view: true, create: false, edit: false, delete: false },
        fileManager: { view: true, create: false, edit: false, delete: false },
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
        users: { view: false, create: false, edit: false, delete: false },
        attendance: { view: true, create: false, edit: false, delete: false },
        leaves: { view: true, create: false, edit: true, delete: false },
        payroll: { view: true, create: false, edit: false, delete: false },
        fileManager: { view: true, create: false, edit: false, delete: false },
        importExport: { view: false, create: false, edit: false, delete: false },
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

const getUserPermissions = async (user) => {
    if (!user) return null;
    
    if (user.customRoleId) {
        try {
            const role = await Role.findById(user.customRoleId);
            if (role) {
                const permissions = {};
                for (const [key, value] of Object.entries(role.permissions)) {
                    permissions[key] = value;
                }
                return permissions;
            }
        } catch (error) {
            console.error('Error fetching custom role:', error);
        }
    }
    
    return BUILT_IN_PERMISSIONS[user.role] || null;
};

const authorize = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized: No user found" });
            }

            if (!allowedRoles.includes(req.user.role)) {
                const permissions = await getUserPermissions(req.user);
                if (!permissions || !permissions.roles || !permissions.roles.view) {
                    return res.status(403).json({ message: `Forbidden: Access denied for role ${req.user.role}` });
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

            const permissions = await getUserPermissions(req.user);
            
            if (!permissions || !permissions[moduleName]) {
                return res.status(403).json({ message: `Forbidden: No access to ${moduleName}` });
            }

            if (!permissions[moduleName][action]) {
                return res.status(403).json({ message: `Forbidden: Cannot ${action} ${moduleName}` });
            }

            req.userPermissions = permissions;
            next();
        } catch (error) {
            console.error('Module authorization error:', error);
            res.status(500).json({ message: 'Module authorization failed' });
        }
    };
};

module.exports = authorize;
module.exports.authorizeModule = authorizeModule;
module.exports.getUserPermissions = getUserPermissions;
module.exports.BUILT_IN_PERMISSIONS = BUILT_IN_PERMISSIONS;
module.exports.MODULE_PERMISSIONS = MODULE_PERMISSIONS;

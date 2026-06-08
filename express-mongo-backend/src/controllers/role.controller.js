const Role = require("../models/Role");
const User = require("../models/User");

const MODULES = [
    'dashboard', 'candidates', 'jobs', 'operations', 'tasks', 
    'callHistory', 'offers', 'users', 'attendance', 'leaves', 
    'payroll', 'fileManager', 'importExport', 'settings', 
    'birthdays', 'roles'
];

const ACTIONS = ['view', 'create', 'edit', 'delete'];

const BUILT_IN_DEFAULTS = {
    'Super Admin': Object.fromEntries(MODULES.map(m => [m.key, { view: true, create: true, edit: true, delete: true }])),
    'Admin': Object.fromEntries(MODULES.map(m => [m.key, { view: true, create: true, edit: true, delete: true }])),
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

const seedBuiltInRoles = async () => {
    const builtInRoleNames = Object.keys(BUILT_IN_DEFAULTS);
    const BUILT_IN_REPORTS_TO = {
        'HR': 'Admin',
        'Manager': 'HR',
        'Team Lead': 'Manager',
        'Recruiter': 'Team Lead',
        'Normal User': 'Recruiter'
    };
    
    for (const roleName of builtInRoleNames) {
        const existingRole = await Role.findOne({ name: roleName, isBuiltIn: true });
        if (!existingRole) {
            const role = new Role({
                name: roleName,
                description: roleName === 'Super Admin' ? 'Full system access' : 
                             roleName === 'Admin' ? 'Administrative access' :
                             `System ${roleName.toLowerCase()} role`,
                isBuiltIn: true,
                permissions: BUILT_IN_DEFAULTS[roleName],
                reportsTo: BUILT_IN_REPORTS_TO[roleName] || null
            });
            await role.save();
            console.log(`Seeded built-in role: ${roleName}`);
        } else if (existingRole.reportsTo === undefined || existingRole.reportsTo === null) {
            existingRole.reportsTo = BUILT_IN_REPORTS_TO[roleName] || null;
            await existingRole.save();
            console.log(`Updated reportsTo for built-in role: ${roleName}`);
        }
    }
};

const getRoles = async (req, res) => {
    try {
        await seedBuiltInRoles();
        const roles = await Role.find()
            .populate('createdBy', 'name email')
            .sort({ isBuiltIn: -1, createdAt: -1 });
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Failed to fetch roles' });
    }
};

const getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id)
            .populate('createdBy', 'name email');
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json(role);
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ message: 'Failed to fetch role' });
    }
};

const createRole = async (req, res) => {
    try {
        const { name, description, permissions, reportsTo } = req.body;
        
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(400).json({ message: 'Role with this name already exists' });
        }

        const processedPermissions = {};
        MODULES.forEach(module => {
            if (permissions && permissions[module]) {
                processedPermissions[module] = {
                    view: !!permissions[module].view,
                    create: !!permissions[module].create,
                    edit: !!permissions[module].edit,
                    delete: !!permissions[module].delete
                };
            } else {
                processedPermissions[module] = { view: false, create: false, edit: false, delete: false };
            }
        });

        const role = new Role({
            name,
            description: description || '',
            isBuiltIn: false,
            permissions: processedPermissions,
            reportsTo: reportsTo || null,
            createdBy: req.user._id
        });

        await role.save();
        await role.populate('createdBy', 'name email');
        res.status(201).json(role);
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ message: 'Failed to create role' });
    }
};

const updateRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        if (role.name === 'Super Admin') {
            return res.status(403).json({ message: 'Cannot modify Super Admin role' });
        }

        const { name, description, permissions, reportsTo } = req.body;

        if (name && name !== role.name) {
            const existingRole = await Role.findOne({ name, _id: { $ne: role._id } });
            if (existingRole) {
                return res.status(400).json({ message: 'Role with this name already exists' });
            }
            role.name = name;
        }

        if (description !== undefined) {
            role.description = description;
        }

        if (reportsTo !== undefined) {
            role.reportsTo = reportsTo || null;
        }

        if (permissions) {
            const processedPermissions = {};
            MODULES.forEach(module => {
                if (permissions[module]) {
                    processedPermissions[module] = {
                        view: !!permissions[module].view,
                        create: !!permissions[module].create,
                        edit: !!permissions[module].edit,
                        delete: !!permissions[module].delete
                    };
                } else {
                    processedPermissions[module] = { view: false, create: false, edit: false, delete: false };
                }
            });
            role.permissions = processedPermissions;
        }

        await role.save();
        await role.populate('createdBy', 'name email');
        res.json(role);
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ message: 'Failed to update role' });
    }
};

const deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        if (role.isBuiltIn) {
            return res.status(403).json({ message: 'Cannot delete built-in roles' });
        }

        const usersWithRole = await User.countDocuments({ customRoleId: role._id });
        if (usersWithRole > 0) {
            return res.status(400).json({ 
                message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.` 
            });
        }

        await Role.findByIdAndDelete(req.params.id);
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ message: 'Failed to delete role' });
    }
};

const resetRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        if (role.name === 'Super Admin') {
            return res.status(403).json({ message: 'Cannot reset Super Admin role' });
        }

        if (!BUILT_IN_DEFAULTS[role.name]) {
            return res.status(400).json({ message: 'Role does not have default permissions to reset' });
        }

        role.permissions = BUILT_IN_DEFAULTS[role.name];
        await role.save();
        await role.populate('createdBy', 'name email');
        res.json(role);
    } catch (error) {
        console.error('Error resetting role:', error);
        res.status(500).json({ message: 'Failed to reset role' });
    }
};

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    resetRole,
    seedBuiltInRoles,
    MODULES,
    ACTIONS,
    BUILT_IN_DEFAULTS
};

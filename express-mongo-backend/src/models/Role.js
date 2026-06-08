const mongoose = require("mongoose");

const MODULES = [
    'dashboard', 'candidates', 'jobs', 'operations', 'tasks', 
    'callHistory', 'offers', 'users', 'attendance', 'leaves', 
    'payroll', 'fileManager', 'importExport', 'settings', 
    'birthdays', 'roles'
];

const permissionSchema = new mongoose.Schema({
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
}, { _id: false });

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        description: {
            type: String,
            default: ''
        },
        isBuiltIn: {
            type: Boolean,
            default: false
        },
        permissions: {
            type: Map,
            of: permissionSchema,
            default: () => {
                const defaultPermissions = {};
                MODULES.forEach(module => {
                    defaultPermissions[module] = { view: false, create: false, edit: false, delete: false };
                });
                return defaultPermissions;
            }
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reportsTo: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);


module.exports = mongoose.model("Role", roleSchema);

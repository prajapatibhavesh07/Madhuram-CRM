const User = require("../models/User");
const Role = require("../models/Role");
const auditService = require("../services/auditService");
const path = require("path");

let autoSeeded = false;

// Create user
exports.createUser = async (req, res) => {
    try {
        const { email, phone, username } = req.body;

        // Check for duplicate email
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ error: "A user with this email address already exists." });
            }
        }

        // Check for duplicate phone
        if (phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({ error: "A user with this phone number already exists." });
            }
        }

        // Check for duplicate username
        if (username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.status(400).json({ error: "This username is already taken." });
            }
        }

        const userData = { ...req.body };
        if (userData.customRoleId === "" || userData.customRoleId === "null" || userData.customRoleId === "undefined") {
            userData.customRoleId = null;
        }
        if (userData.role && !userData.customRoleId) {
            const customRole = await Role.findOne({ name: userData.role, isBuiltIn: false });
            if (customRole) {
                userData.customRoleId = customRole._id;
            }
        }
        if (req.file) {
            userData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
        }

        const user = await User.create(userData);
        
        await auditService.logAction(req, {
            action: 'CREATE',
            module: 'User',
            targetId: user._id,
            targetModel: 'User',
            details: `User "${user.name}" created`
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const query = {};
        if (role) {
            query.role = role;
        }
        const users = await User.find(query).populate('managerId', 'name').populate('teamLeadId', 'name');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single user
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('managerId', 'name').populate('teamLeadId', 'name');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { email, phone, username } = req.body;
        const userId = req.params.id;

        // Check for duplicate email
        if (email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
            if (existingEmail) {
                return res.status(400).json({ error: "A user with this email address already exists." });
            }
        }

        // Check for duplicate phone
        if (phone) {
            const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
            if (existingPhone) {
                return res.status(400).json({ error: "A user with this phone number already exists." });
            }
        }

        // Check for duplicate username
        if (username) {
            const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
            if (existingUsername) {
                return res.status(400).json({ error: "This username is already taken." });
            }
        }

        const oldUser = await User.findById(userId);
        if (!oldUser) return res.status(404).json({ message: "User find failed for audit" });

        const updateData = { ...req.body };
        if (updateData.customRoleId === "" || updateData.customRoleId === "null" || updateData.customRoleId === "undefined") {
            updateData.customRoleId = null;
        }
        if (updateData.role && !updateData.customRoleId) {
            const customRole = await Role.findOne({ name: updateData.role, isBuiltIn: false });
            if (customRole) {
                updateData.customRoleId = customRole._id;
            }
        }
        if (req.file) {
            updateData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
        }

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true })
            .populate('managerId', 'name')
            .populate('teamLeadId', 'name');
        if (!user) return res.status(404).json({ message: "User not found" });

        const changes = auditService.detectChanges(oldUser, user);
        if (changes) {
            await auditService.logAction(req, {
                action: 'UPDATE',
                module: 'User',
                targetId: user._id,
                targetModel: 'User',
                changes,
                details: `User "${user.name}" updated`
            });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        await auditService.logAction(req, {
            action: 'DELETE',
            module: 'User',
            targetId: user._id,
            targetModel: 'User',
            details: `User "${user.name}" deleted`
        });

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk delete users
exports.bulkDeleteUsers = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: "No user IDs provided" });
        }

        const result = await User.deleteMany({ _id: { $in: ids } });
        
        await auditService.logAction(req, {
            action: 'BULK_DELETE',
            module: 'User',
            details: `Deleted ${result.deletedCount} users`
        });

        res.json({ message: `${result.deletedCount} users deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.status === 'Inactive') {
            return res.status(403).json({ message: "Your account has been deactivated. Please contact the administrator." });
        }

        // Update online status and last login
        user.isOnline = true;
        user.lastLogin = new Date();
        await user.save();

        await auditService.logAction({ ...req, user }, {
            action: 'LOGIN',
            module: 'User',
            targetId: user._id,
            targetModel: 'User',
            details: `User "${user.name}" logged in`
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Logout
exports.logout = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isOnline = false;
            await user.save();

            await auditService.logAction(req, {
                action: 'LOGOUT',
                module: 'User',
                targetId: user._id,
                targetModel: 'User',
                details: `User "${user.name}" logged out`
            });
        }
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (user.password !== oldPassword) {
            return res.status(401).json({ message: "Incorrect old password" });
        }
        
        user.password = newPassword;
        await user.save();
        
        await auditService.logAction(req, {
            action: 'UPDATE_PASSWORD',
            module: 'User',
            targetId: user._id,
            targetModel: 'User',
            details: `User "${user.name}" changed password`
        });
        
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

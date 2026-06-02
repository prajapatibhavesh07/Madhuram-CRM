import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Register Request Body:', req.body);
        const { username, email, password, fullName, role } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.log('User already exists:', username, email);
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Create new user
        // Note: In production, password should be hashed (e.g., using bcrypt)
        const newUser = new User({
            username,
            email,
            password, // TODO: Hash this password
            fullName,
            role: role || 'Editor'
        });

        const savedUser = await newUser.save();
        console.log('User saved successfully:', savedUser._id);

        // Return user without password
        const { password: _, ...userData } = savedUser.toObject();
        res.status(201).json(userData);
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({
            $or: [{ username: username }, { email: username }]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check password
        if (user.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const { password: _, ...userData } = user.toObject();
        res.status(200).json(userData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;

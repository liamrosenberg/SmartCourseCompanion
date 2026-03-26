const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Importing User blueprint
const jwt = require('jsonwebtoken');

// POST: Register a new user
router.post('/register', async (req, res) => {
    try {
        // 1. Grab the data sent from the frontend
        const { username, email, password, role } = req.body;

        // 2. Check if a user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // 3. Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create the new user object
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'student' // Default to student if no role is provided
        });

        // 5. Save the user to MongoDB
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST: Login an existing user
router.post('/login', async (req, res) => {
    try {
        // 1. Accept username instead of email from req.body
        const { username, password } = req.body;

        // 2. Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // 3. Check password (existing logic)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // ... (rest of your JWT generation logic remains the same)
        const payload = { userId: user._id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: { id: user._id, username: user.username, role: user.role }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Importing User blueprint
const jwt = require('jsonwebtoken');

// POST: Register a new user
router.post('/register', async (req, res) => {
    try {
        // Log the incoming data so you can see it in your backend terminal
        console.log("Registration attempt with data:", req.body);

        // 1. Destructure the expected fields from the frontend request
        const { username, firstName, lastName, email, password, role } = req.body;

        // 2. Catch Missing Data Early
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // 3. Check if user already exists to prevent MongoDB E11000 crashes
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "This username is already taken. Please choose another." });
        }

        // 4. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create the new user object
        const newUser = new User({
            username: username,
            firstName: firstName,
            lastName: lastName,
            email,
            password: hashedPassword,
            role: role || 'student', // Fallback if role isn't provided
        });

        // 6. Save to the database
        await newUser.save();

        // 7. Send success back to landingPage.js
        res.status(201).json({ message: "Registration successful!" });

    } catch (error) {
        console.error("🔥 Registration Server Error:", error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: "Validation Error", errors: messages });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `An account with that ${field} already exists.` });
        }

        res.status(500).json({ message: "Internal server error. Check the backend terminal." });
    }
});

router.post('/login', async (req, res) => {
    try {
        console.log("Login attempt with data:", req.body);

        const { username, password, role } = req.body || {};

        if (!username || !password || !role) {
            return res.status(400).json({ message: "Username, password, and role are required." });
        }

        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(400).json({ message: "User not found. Please register first." });
        }

        if (user.role !== role) {
            return res.status(403).json({ message: `Access denied. You are not registered as an ${role}.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error("🔥 Login Server Error:", error);
        res.status(500).json({ message: "Internal server error during login." });
    }
});

module.exports = router;
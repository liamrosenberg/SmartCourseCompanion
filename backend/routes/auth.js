const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Importing User blueprint
const jwt = require('jsonwebtoken');

// Register a new user
router.post('/register', async (req, res) => {
    try {
        // Logging incoming data
        console.log("Registration attempt with data:", req.body);

        // Expected fields from the frontend
        const { username, firstName, lastName, email, password, role } = req.body;

        // Catching missing fields
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Checking if user already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "This username is already taken. Please choose another." });
        }

        // Hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Creating a new user object finally
        const newUser = new User({
            username: username,
            firstName: firstName,
            lastName: lastName,
            email,
            password: hashedPassword,
            role: role || 'student',
        });

        // Saving user to database
        await newUser.save();

        // Letting the frontend know registration was successful
        res.status(201).json({ message: "Registration successful!" });

    } catch (error) {
        console.error("🔥 Registration Server Error:", error);
        
        // Handling validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: "Validation Error", errors: messages });
        }
        
        // Duplicate handling
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `An account with that ${field} already exists.` });
        }

        res.status(500).json({ message: "Internal server error. Check the backend terminal." });
    }
});

// Login existing user
router.post('/login', async (req, res) => {
    try {
        console.log("Login attempt with data:", req.body);

        // Preventing crash
        const { username, password, role } = req.body || {}; 

        // Catch missing data
        if (!username || !password || !role) {
            return res.status(400).json({ message: "Username, password, and role are required." });
        }

        // MongoDB finds user
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(400).json({ message: "User not found. Please register first." });
        }

        if (user.role !== role) {
            return res.status(403).json({ message: `Access denied. You are not registered as an ${role}.` });
        }

        // Comparing hashed password with the one provided
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        // Creating a JWT token for user
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1h' }
        );

        // Letting the frontend know login was successful
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
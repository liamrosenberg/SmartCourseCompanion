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
        // (Adjust these fields if your frontend sends different names)
        const { username, firstName, lastName, email, password, role } = req.body;

        // 2. Catch Missing Data Early
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // 3. Check if user already exists to prevent MongoDB E11000 crashes
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists." });
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
        
        // Handle Mongoose Schema Validation Errors (e.g., a required field is missing in your schema)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: "Validation Error", errors: messages });
        }
        
        // Handle MongoDB Duplicate Key Error (just in case the findOne check misses a race condition)
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `An account with that ${field} already exists.` });
        }

        // Generic Server Error (Frontend will now at least get a JSON response)
        res.status(500).json({ message: "Internal server error. Check the backend terminal." });
    }
});

// (Keep your existing router.post('/login', ...) route down here)
router.post('/login', async (req, res) => {
    try {
        console.log("Login attempt with data:", req.body);

        // 👉 1. THIS PREVENTS THE CRASH: We add "|| {}" so if req.body is completely missing, 
        // the server just sees a blank object instead of crashing trying to read 'undefined'.
        const { username, password } = req.body || {}; 

        // 2. Catch missing data early
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        // 👉 3. HERE IS THE OPERATION! We ask MongoDB to find the user.
        const user = await User.findOne({ username: username });
        
        if (!user) {
            return res.status(400).json({ message: "User not found. Please register first." });
        }

        // 4. Compare the typed password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        // 5. Create a token (so the user stays logged in)
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || 'fallback_secret_key', 
            { expiresIn: '1h' }
        );

        // 6. Send the success response back to landingPage.js!
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
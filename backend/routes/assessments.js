const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment'); // Ray's model
const verifyToken = require('../middleware/authMiddleware'); // Liam's auth

// POST: Save grade and calculate average on server 
router.post('/add-grade', verifyToken, async (req, res) => {
    const { courseCode, name, earnedMarks, totalMarks } = req.body;
    
    const newEntry = new Assessment({
        user: req.user.id, // From Liam's token
        courseCode,
        name,
        earnedMarks,
        totalMarks,
        isCompleted: true
    });
    await newEntry.save();

    // SERVER-SIDE CALCULATION 
    const allGrades = await Assessment.find({ user: req.user.id, courseCode });
    let earnedSum = 0;
    let totalSum = 0;
    allGrades.forEach(g => {
        earnedSum += g.earnedMarks;
        totalSum += g.totalMarks;
    });
    
    const avg = (earnedSum / totalSum) * 100;
    res.json({ serverCalculatedAverage: avg.toFixed(1) });
});

// GET: Get calculated average for a specific course
router.get('/average/:courseCode', verifyToken, async (req, res) => {
    try {
        const { courseCode } = req.params;
        const allGrades = await Assessment.find({ 
            user: req.user.id, 
            courseCode,
            earnedMarks: { $exists: true } 
        });

        if (allGrades.length === 0) return res.json({ average: "--" });

        let earnedSum = 0;
        let totalSum = 0;
        allGrades.forEach(g => {
            earnedSum += g.earnedMarks;
            totalSum += g.totalSum || g.totalMarks; // Handle naming consistency
        });

        const avg = (earnedSum / totalSum) * 100;
        res.json({ average: avg.toFixed(1) });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
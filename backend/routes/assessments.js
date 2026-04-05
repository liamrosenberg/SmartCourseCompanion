const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment'); // Ray's model
const verifyToken = require('../middleware/authMiddleware'); // Liam's auth

// POST /api/assessments — create a new scheduled/pending assessment (no marks yet)
// Used by the courseDetails calendar to schedule upcoming tasks
router.post('/', async (req, res) => {
    try {
        const { courseCode, name, description, dueDate } = req.body;

        if (!courseCode || !name) {
            return res.status(400).json({ message: 'Course code and name are required' });
        }

        const newAssessment = new Assessment({
            user: req.user.id,
            courseCode,
            name,
            description,
            dueDate,
            isCompleted: false
        });

        await newAssessment.save();
        res.status(201).json(newAssessment);
    } catch (error) {
        console.error('Error creating assessment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

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

// PUT /api/assessments/:assessmentId — update an assessment the logged-in user owns
router.put('/:assessmentId', async (req, res) => {
    try {
        // findOne with user: req.user.id ensures students can only edit their own records
        const assessment = await Assessment.findOne({
            _id: req.params.assessmentId,
            user: req.user.id
        });

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        const { name, description, earnedMarks, totalMarks, dueDate } = req.body;
        if (name !== undefined) assessment.name = name;
        if (description !== undefined) assessment.description = description;
        if (earnedMarks !== undefined) assessment.earnedMarks = earnedMarks;
        if (totalMarks !== undefined) assessment.totalMarks = totalMarks;
        if (dueDate !== undefined) assessment.dueDate = dueDate;

        await assessment.save();
        res.json(assessment);
    } catch (error) {
        console.error('Error updating assessment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/assessments/:assessmentId — delete an assessment the logged-in user owns
router.delete('/:assessmentId', async (req, res) => {
    try {
        const assessment = await Assessment.findOneAndDelete({
            _id: req.params.assessmentId,
            user: req.user.id
        });

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        res.json({ message: 'Assessment deleted successfully' });
    } catch (error) {
        console.error('Error deleting assessment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/assessments/:userId — get all assessments for a user (for dashboard)
router.get('/:userId', async (req, res) => {
    try {
        const assessments = await Assessment.find({ user: req.params.userId });
        res.json(assessments);
    } catch(error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
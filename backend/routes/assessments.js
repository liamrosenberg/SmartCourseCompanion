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
        isCompleted: true,
        source: 'grade'
    });
    await newEntry.save();

    // SERVER-SIDE CALCULATION (weighted average: sum(score × weight) / sum(weight))
    const allGrades = await Assessment.find({ user: req.user.id, courseCode, earnedMarks: { $exists: true }, totalMarks: { $exists: true } });
    const weightedSum = allGrades.reduce((sum, g) => sum + g.earnedMarks * g.totalMarks, 0);
    const worthSum    = allGrades.reduce((sum, g) => sum + g.totalMarks, 0);
    const avg = worthSum > 0 ? weightedSum / worthSum : 0;
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

        const weightedSum = allGrades.reduce((sum, g) => sum + g.earnedMarks * g.totalMarks, 0);
        const worthSum    = allGrades.reduce((sum, g) => sum + g.totalMarks, 0);
        const avg = worthSum > 0 ? weightedSum / worthSum : 0;
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

        const { name, description, earnedMarks, totalMarks, dueDate, isCompleted } = req.body;
        if (name !== undefined) assessment.name = name;
        if (description !== undefined) assessment.description = description;
        if (earnedMarks !== undefined) {
            const e = Number(earnedMarks);
            if (isNaN(e) || e < 0 || e > 100)
                return res.status(400).json({ message: 'Earned marks must be between 0 and 100.' });
            assessment.earnedMarks = e;
        }
        if (totalMarks !== undefined) {
            const t = Number(totalMarks);
            if (isNaN(t) || t <= 0 || t > 100)
                return res.status(400).json({ message: 'Worth % must be between 1 and 100.' });
            assessment.totalMarks = t;
        }
        if (dueDate !== undefined) assessment.dueDate = dueDate;
        if (isCompleted !== undefined) assessment.isCompleted = isCompleted;

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
        const assessments = await Assessment.find({ user: req.params.userId }).sort({ _id: -1 });
        res.json(assessments);
    } catch(error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Assessment = require('../models/Assessment');

// GET dashboard stats
router.get('/:userId/stats', async (req, res) =>{
    try{
        const userId = req.params.userId;

        // Get user with enrolled courses
        const user = await User.findById(userId).populate('enrolledCourses');
        if (!user){
            return res.status(404).json({ message: 'User not found' });

        }

        // Get all assessments for this user
        const assessments = await Assessment.find({ user: userId});

        // Calculate stats
        const activeCourses = user.enrolledCourses.length;

        // Count pending assessments
        const pendingAssessments = assessments.filter(a => !a.isCompleted).length;

        // Calculate overall avg
        const completedAssessment = assessments.filter(a => a.isCompleted && a.earnedMarks !== undefined && a.totalMarks > 0);
        let overallAverage = 0;

        if (completedAssessment.length > 0){
            const weightedSum = completedAssessment.reduce((sum, a) => sum + (a.earnedMarks * a.totalMarks), 0);
            const worthSum    = completedAssessment.reduce((sum, a) => sum + a.totalMarks, 0);
            overallAverage    = (weightedSum / worthSum).toFixed(1);
        }

        // Get course avg for chart
        const courseAverage = {};
        user.enrolledCourses.forEach(course => {
            const courseAssessments = assessments.filter(
                a => a.courseCode === course.courseCode && a.isCompleted && a.totalMarks > 0
            );

            if (courseAssessments.length > 0){
                const weightedSum = courseAssessments.reduce((sum, a) => sum + (a.earnedMarks * a.totalMarks), 0);
                const worthSum    = courseAssessments.reduce((sum, a) => sum + a.totalMarks, 0);
                const avg         = weightedSum / worthSum;

                courseAverage[course.courseCode] = {
                    courseName: course.courseName,
                    average: avg.toFixed(1)
                };
            }
        });

        // Assessment completion stats for doughnut chart
        const completedCount = assessments.filter(a => a.isCompleted).length;

        // Compare dates at day-level so assessments due TODAY are still "Pending", not "Overdue"
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const overdueCount = assessments.filter(a => {
            if (!a.isCompleted && a.dueDate) {
                const due = new Date(a.dueDate);
                due.setHours(0, 0, 0, 0);
                return due < startOfToday; // strictly before today = overdue
            }
            return false;
        }).length;
        const pendingCount = pendingAssessments - overdueCount;

        res.json({
            activeCourses,
            overallAverage,
            pendingAssessments: pendingCount,
            courseAverage,
            assessmentProgress: {
                completed: completedCount,
                pending: pendingCount,
                overdue: overdueCount
            }
        });
    } catch (error){
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'server error'});
    }
    
});

module.exports = router;
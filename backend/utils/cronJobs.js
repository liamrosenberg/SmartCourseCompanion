const cron = require('node-cron');
const Assessment = require('../models/Assessment');
const Course = require('../models/Course');
const User = require('../models/User');
const sendEmail = require('./sendEmail');

// Scheduling tasks
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running Daily Assessment Reminder Check...');

    try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);

        const upcomingAssessments = await Assessment.find({
            dueDate: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lte: targetDate 
            }
        });

        if (upcomingAssessments.length === 0) {
            console.log('No upcoming assessments in the next 3 days.');
            return;
        }

        // Loop through upcoming assessments
        for (let assessment of upcomingAssessments) {
            // Get course info
            const course = await Course.findById(assessment.courseId);
            if (!course) continue;

            // Find all students in the database
            const students = await User.find({ role: 'student' }); 

            // Send emails
            for (let student of students) {
                const subject = `Reminder: ${assessment.title} is due soon!`;
                const message = `Hello ${student.firstName || student.username},\n\nThis is a friendly reminder that your assessment "${assessment.title}" for ${course.name} is due on ${assessment.dueDate.toDateString()}.\n\nGood luck!`;
                
                await sendEmail(student.email, subject, message);
            }
        }
    } catch (error) {
        console.error("🔥 Error in cron job:", error);
    }
});
// backend/utils/cronJobs.js
const cron = require('node-cron');
const Assessment = require('../models/Assessment');
const Course = require('../models/Course');
const User = require('../models/User');
const sendEmail = require('./sendEmail');

// Schedule tasks to be run on the server.
// '0 8 * * *' means run every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running Daily Assessment Reminder Check...');

    try {
        // 1. Define the time window (e.g., 3 days from now)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);

        // Find assessments due exactly 3 days from now
        // (You may need to adjust this depending on how you save dates in your schema)
        const upcomingAssessments = await Assessment.find({
            dueDate: {
                $gte: new Date().setHours(0, 0, 0, 0), // From today
                $lte: targetDate // Up to 3 days from now
            }
        });

        if (upcomingAssessments.length === 0) {
            console.log('No upcoming assessments in the next 3 days.');
            return;
        }

        // 2. Loop through the upcoming assessments
        for (let assessment of upcomingAssessments) {
            // Get the course info
            const course = await Course.findById(assessment.courseId);
            if (!course) continue;

            // 3. Find all students in the database
            // (If your Course schema tracks enrolled students, you would loop through those IDs instead)
            const students = await User.find({ role: 'student' }); 

            // 4. Send the emails
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
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
            const course = await Course.findOne({ courseCode: assessment.courseCode });
            if (!course) continue;

            // 3. Find only the student who owns this assessment
            const student = await User.findById(assessment.user);
            if (!student) continue;

            // 4. Send the email
            const subject = `Reminder: ${assessment.name} is due soon!`;
            const message = `Hello ${student.firstName || student.username},\n\nThis is a friendly reminder that your assessment "${assessment.name}" for ${course.courseName} is due on ${assessment.dueDate.toDateString()}.\n\nGood luck!`;

            await sendEmail(student.email, subject, message);
        }
    } catch (error) {
        console.error("🔥 Error in cron job:", error);
    }
});
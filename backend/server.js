// Loading env variables and cron jobs
require('dotenv').config();
require('./utils/cronJobs');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const courseRoutes = require('./routes/courses');
const assessmentRoutes = require('./routes/assessments');
const studnetRoutes = require('./routes/students');
const verifyToken = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/courses', verifyToken, courseRoutes);
app.use('/api/assessments', verifyToken, assessmentRoutes);
app.use('/api/students', verifyToken, studnetRoutes);

// Connecting to database
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB Atlas!');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });

// Defining routes
app.get('/', (req, res) => {
    res.send('Smart Course Companion Server is running and connected to the database!');
});
// Importing auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');

// GET /api/courses for browse page

router.get('/', async (req, res) => {
    try{
        const courses = await Course.find({ isActive: true });
        res.json(courses);
    } catch (error){
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/couses/search Search Courses

router.get('/search', async (req, res) => {
    try{
        const query = req.query.q;
        if (!query){
            return res.status(400).json({ message: 'Search query required' });
        }

        const courses = await Course.find({
        isActive: true,
        $or: [
            { courseName: { $regex: query, $options: 'i' } },
            { courseCode: { $regex: query, $options: 'i' } }
        ]
    });
        res.json(courses);
    } catch (error){
        console.error('Error searching course', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/courses/enrolled Get enrolled courses for a student
router.get('/enrolled/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('enrolledCourses');

        if (!user){
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.enrolledCourses);
    } catch (error){
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({ message: 'Server error'});
    }
});

// POST /api/courses/enroll Enroll in a course
router.post('/enroll', async (req, res) => {
    try{
        const { userId, courseId} = req.body;

        const user = await User.findById(userId);
        if (!user){
            return res.status(404).json({ message: 'User not found' });
        }

        const course = await Course.findById(courseId);
        if (!course){
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if already enrolled
        if (user.enrolledCourses.includes(courseId)){
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }
        user.enrolledCourses.push(courseId);
        await user.save();

        res.json({ message: 'Succefully enrolled in course', course});
    } catch (error){
        console.error('Error enrolling in course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/courses/enroll/:userId/:courseId
// aka drop course

router.delete('/enroll/:userId/:courseId', async (req, res) => {
    try{
        const { userId, courseId } = req.params;

        const user = await User.findById(userId);
        if (!user){
            return res.status(404).json({ message: 'User not found' });
        }

        user.enrolledCourses = user.enrolledCourses.filter(
            id => id.toString() !== courseId
        );
        await user.save();

        res.json({ message: 'Succefully dropped course'});

    } catch (error){
        console.error('Error dropping couse:', error);
        res.status(500).json({ message: 'Server error'});
    }
});

module.exports = router;
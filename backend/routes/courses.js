const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');

// =====================
// STUDENT ROUTES
// =====================

// GET /api/courses — active courses for student browse page
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({ isActive: true });
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/courses/search — search active courses
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
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
    } catch (error) {
        console.error('Error searching course', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/courses/enrolled/:userId — get enrolled courses for a student
router.get('/enrolled/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('enrolledCourses');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.enrolledCourses);
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/courses/enroll — enroll in a course
router.post('/enroll', async (req, res) => {
    try {
        const { userId, courseId } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }
        user.enrolledCourses.push(courseId);
        await user.save();
        res.json({ message: 'Successfully enrolled in course', course });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/courses/enroll/:userId/:courseId — drop a course
router.delete('/enroll/:userId/:courseId', async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.enrolledCourses = user.enrolledCourses.filter(
            id => id.toString() !== courseId
        );
        await user.save();
        res.json({ message: 'Successfully dropped course' });
    } catch (error) {
        console.error('Error dropping course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// =====================
// ADMIN ROUTES
// =====================

// GET /api/courses/all get all courses for admin dashboard
router.get('/all', async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Failed to load courses from the database." });
    }
});

// POST /api/courses create a new course (admin)
router.post('/', async (req, res) => {
    try {
        const { courseName, courseCode, instructor, categories, isActive } = req.body;
        const newCourse = new Course({ courseName, courseCode, instructor, categories, isActive });
        const savedCourse = await newCourse.save();
        res.status(201).json({ message: "Course successfully created!", course: savedCourse });
    } catch (error) {
        console.error("Error creating course:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "A course with this Course Code already exists." });
        }
        res.status(500).json({ message: "Failed to create course." });
    }
});

// PUT /api/courses/:id  update a course (admin)
router.put('/:id', async (req, res) => {
    try {
        const updateData = { ...req.body };
        delete updateData._id;
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found." });
        }
        res.status(200).json(updatedCourse);
    } catch (error) {
        console.error("Error updating course:", error.message);
        res.status(500).json({ message: "Failed to update course database." });
    }
});

// DELETE /api/courses/:id  delete a course (admin)
router.delete('/:id', async (req, res) => {
    try {
        const deletedCourse = await Course.findByIdAndDelete(req.params.id);
        if (!deletedCourse) {
            return res.status(404).json({ message: "Course not found." });
        }
        res.status(200).json({ message: "Course deleted successfully." });
    } catch (error) {
        console.error("Error deleting course:", error.message);
        res.status(500).json({ message: "Failed to delete course from database." });
    }
});

module.exports = router;
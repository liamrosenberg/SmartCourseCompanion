const express = require('express');
const router = express.Router();
const Course = require('../models/Course'); 

// GET: Fetch all courses to display on the Admin Dashboard
router.get('/', async (req, res) => {
    try {
        // Ask MongoDB for every course in the database
        const courses = await Course.find();
        
        // Send them back to the frontend 
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Failed to load courses from the database." });
    }
});

// POST: Create a new course 
router.post('/', async (req, res) => {
    try {
        const { courseName, courseCode, instructor, categories, isActive } = req.body;
        
        const newCourse = new Course({
            courseName,
            courseCode,
            instructor,
            categories,
            isActive
        });

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
// PUT: Update an existing course's assessments
router.put('/:id', async (req, res) => {
    try {
        // Find the course by its ID and update its data with whatever the frontend sends
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true } // Return the freshly updated document
        );
        
        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found." });
        }
        res.status(200).json(updatedCourse);
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: "Failed to update course." });
    }
});
module.exports = router;



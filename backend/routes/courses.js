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
// PUT: Update an existing course (Assessments OR Status)
router.put('/:id', async (req, res) => {
    try {
        // Create a copy of the incoming data, but delete the _id just in case 
        // to prevent MongoDB "Cast to ObjectId" crashes
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
module.exports = router;



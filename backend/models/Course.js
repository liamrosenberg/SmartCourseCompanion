const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName: {type: String, required: true},
    courseCode: {type: String, required: true, unique: true},
    instructor: {type: String, required: true},
    categories: [{ // For categorizing assessments
        name: { type: String, required: true }, // Like midterm, final, project, etc.
        weight: { type: Number, required: true } // Like 30% for midterm, 50% for final, etc.
    }],
    isActive: {type: Boolean, default: false},
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
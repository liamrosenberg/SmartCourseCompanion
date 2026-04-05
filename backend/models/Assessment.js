const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseCode: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date },
    earnedMarks: { type: Number, min: 0}, // Earned marks means like the actual grade received
    totalMarks: { type: Number, min: 1}, // Total marks means like the highest possible grade
    isCompleted: { type: Boolean, default: false },
    source: { type: String, enum: ['assessment', 'grade'], default: 'assessment' }
}, { timestamps: true });

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
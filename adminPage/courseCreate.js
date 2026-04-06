document.addEventListener('DOMContentLoaded', () => {
    
    const templateSelect = document.getElementById('courseTemplateSelect');

    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            const selected = this.value;

            // Grab the specific input boxes from HTML
            const midtermInput = document.getElementById('midtermWeight');
            const finalInput = document.getElementById('finalWeight');
            const assignmentInput = document.getElementById('assignmentWeight');

            // Drop in the correct numbers based on the choice
            if (selected === 'standard') {
                midtermInput.value = 30;
                assignmentInput.value = 20;
                finalInput.value = 50;
            } else if (selected === 'project') {
                midtermInput.value = 15;
                assignmentInput.value = 45;
                finalInput.value = 40;
            } else if (selected === 'test_heavy') {
                midtermInput.value = 50;
                assignmentInput.value = 0;
                finalInput.value = 50;
            }
        });
    }
});

// 2. Your Saving Logic
async function saveNewCourse(event) {
    event.preventDefault(); 

    const courseName = document.getElementById('courseNameInput').value;
    const courseCode = document.getElementById('courseCodeInput').value; 
    const instructorName = document.getElementById('instructorInput').value; 

    // Gather the assessment weightings
    const midtermWeight = Number(document.getElementById('midtermWeight') ? document.getElementById('midtermWeight').value : 0);
    const finalWeight = Number(document.getElementById('finalWeight') ? document.getElementById('finalWeight').value : 0);
    const assignmentWeight = Number(document.getElementById('assignmentWeight') ? document.getElementById('assignmentWeight').value : 0);

    // Optional Safety Check: Ensure it adds up to 100%
    const totalWeight = midtermWeight + finalWeight + assignmentWeight;
    if (totalWeight !== 100) {
        const proceed = confirm(`Warning: Your total weight adds up to ${totalWeight}%. It should usually be 100%. Create anyway?`);
        if (!proceed) return;
    }

    const courseData = {
        courseName: courseName,
        courseCode: courseCode,
        instructor: instructorName,
        isActive: false, // Setting to false so it doesn't instantly appear for students until you click 'Enable' on the dashboard
        categories: []
    };

    // Only push the category to MongoDB if the weight is greater than 0
    if (midtermWeight > 0) courseData.categories.push({ name: "Midterm", weight: midtermWeight });
    if (finalWeight > 0) courseData.categories.push({ name: "Final", weight: finalWeight });
    if (assignmentWeight > 0) courseData.categories.push({ name: "Assignments", weight: assignmentWeight });

    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to save a course!");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(courseData)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Success! Course saved to MongoDB.");
            window.location.href = "adminPage.html"; 
        } else {
            alert("Error saving course: " + data.message);
        }
    } catch (error) {
        console.error("Failed to reach the server:", error);
    }
}

// Attach to the form submit
document.querySelector('form').addEventListener('submit', saveNewCourse);
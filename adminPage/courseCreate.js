async function saveNewCourse(event) {
    event.preventDefault(); 

    const courseName = document.getElementById('courseNameInput').value;
    const courseCode = document.getElementById('courseCodeInput').value; 
    const instructorName = document.getElementById('instructorInput').value; 

    // Gather the assessment weightings (Make sure your HTML has these IDs!)
    const midtermWeight = Number(document.getElementById('midtermWeight') ? document.getElementById('midtermWeight').value : 0);
    const finalWeight = Number(document.getElementById('finalWeight') ? document.getElementById('finalWeight').value : 0);
    const assignmentWeight = Number(document.getElementById('assignmentWeight') ? document.getElementById('assignmentWeight').value : 0);

    const courseData = {
        courseName: courseName,
        courseCode: courseCode,
        instructor: instructorName,
        isActive: true,
        categories: [  
            { name: "Midterm", weight: midtermWeight }, 
            { name: "Final", weight: finalWeight },
            { name: "Assignments", weight: assignmentWeight }
        ]
    };

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
            window.location.href = "adminPage.html"; // Go back to dashboard!
        } else {
            alert("Error saving course: " + data.message);
        }
    } catch (error) {
        console.error("Failed to reach the server:", error);
    }
}

// Attach to the form submit
document.querySelector('form').addEventListener('submit', saveNewCourse);
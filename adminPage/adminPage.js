let globalCourses = []; // Stores the courses so the modal can access them

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminCourses();
    setupModalListeners(); // Turn on the modal buttons
});

async function fetchAdminCourses() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = "../landingPage.html"; return; }

    try {
        const response = await fetch('http://localhost:5000/api/courses', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            globalCourses = await response.json();
            renderCourses(globalCourses);
        } else {
            document.getElementById('courses-container').innerHTML = '<p class="text-danger text-center">Failed to load courses.</p>';
        }
    } catch (error) {
        document.getElementById('courses-container').innerHTML = '<p class="text-danger text-center">Server is offline.</p>';
    }
}

function renderCourses(courses) {
    const container = document.getElementById('courses-container');
    container.innerHTML = ''; 

    if (courses.length === 0) {
        container.innerHTML = '<p class="text-secondary text-center">No courses found. Create one to get started!</p>';
        return;
    }

    courses.forEach(course => {
        let weightingsHTML = '';
        if (course.categories && course.categories.length > 0) {
            course.categories.forEach(cat => {
                weightingsHTML += `<p class="text-secondary" style="margin-bottom: 5px;">${cat.name} (<span class="weight-value">${cat.weight}</span>%)</p>`;
            });
        } else {
            weightingsHTML = '<p class="text-secondary">No weightings defined.</p>';
        }

        const btnText = course.isActive ? 'Enabled' : 'Disabled';
        const btnColor = course.isActive ? '#30d630' : '#ff3838';

        const courseCard = document.createElement('div');
        courseCard.className = 'card';
        courseCard.style.marginBottom = 'var(--space-md)';
        
        courseCard.innerHTML = `
            <div class="card-header flex-between" style="align-items: center; margin-bottom: 15px;">
                <div>
                    <h3 class="card-title" style="margin: 0;">${course.courseName}</h3>
                    <h4 class="text-secondary" style="margin: 5px 0 0 0;">ID: ${course.courseCode}</h4>
                </div>
                <button class="btn btn-tertiary status-btn" style="background-color: ${btnColor}; color: white; padding: 5px 15px; border-radius: 4px; border: none; cursor: pointer;">${btnText}</button>
            </div>
            <div class="card-body">
                <div class="grid grid-3">
                    <div>
                        <h4 style="margin-bottom: 10px;">Assessment Weightings</h4>
                        ${weightingsHTML}
                    </div>
                    <div>
                        <h4 style="margin-bottom: 10px;">Current Submissions</h4>
                        <p class="text-secondary">--/--</p>
                    </div>
                </div>
                <div class="button-group mt-md" style="justify-content: flex-start; margin-top: 15px;">
                    <button class="btn btn-secondary edit-assessments-btn" data-id="${course._id}">Edit Assessments</button>
                </div>
            </div>
        `;
        container.appendChild(courseCard);
    });

    attachEditButtonLogic();
}

function attachEditButtonLogic() {
    // 1. Enable/Disable Status Logic (Visual only for now)
    const statusBtns = document.querySelectorAll('.status-btn');
    statusBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.innerText === 'Enabled') {
                this.innerText = 'Disabled';
                this.style.backgroundColor = '#ff3838';
            } else {
                this.innerText = 'Enabled';
                this.style.backgroundColor = '#30d630';
            }
        });
    });

    // 2. Open the Modal when "Edit Assessments" is clicked
    const editAssessmentsBtns = document.querySelectorAll('.edit-assessments-btn');
    editAssessmentsBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const courseId = this.getAttribute('data-id');
            openModal(courseId);
        });
    });
}

// ==========================================
// THE MODAL LOGIC (ADD/DELETE/SAVE)
// ==========================================

function openModal(courseId) {
    const course = globalCourses.find(c => c._id === courseId);
    document.getElementById('modalCourseId').value = courseId; 
    document.getElementById('modalCourseTitle').innerText = `Edit: ${course.courseName}`;
    
    const list = document.getElementById('modalAssessmentList');
    list.innerHTML = ''; // Clear old data
    
    // Draw a row for every existing category
    if (course.categories) {
        course.categories.forEach(cat => {
            list.insertAdjacentHTML('beforeend', createRow(cat.name, cat.weight));
        });
    }
    
    // Show the modal
    document.getElementById('assessmentModal').style.display = 'flex';
}

// HTML blueprint for a single editable row
function createRow(name = '', weight = '') {
    return `
        <div class="assessment-row flex-between" style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
            <input type="text" class="cat-name" value="${name}" placeholder="Name (e.g. Quizzes)" style="flex: 2; padding: 8px; border: 1px solid var(--neutral-300); border-radius: 4px;">
            <input type="number" class="cat-weight" value="${weight}" placeholder="Weight %" style="flex: 1; padding: 8px; border: 1px solid var(--neutral-300); border-radius: 4px;">
            <button type="button" class="delete-row-btn" style="background: #ff3838; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">X</button>
        </div>
    `;
}

function setupModalListeners() {
    const modal = document.getElementById('assessmentModal');

    // Close Modal triggers
    document.getElementById('closeModalBtn').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('cancelModalBtn').addEventListener('click', () => modal.style.display = 'none');

    // Add a blank row
    document.getElementById('addRowBtn').addEventListener('click', () => {
        document.getElementById('modalAssessmentList').insertAdjacentHTML('beforeend', createRow());
    });

    // Delete a row (Listens to the whole list, triggers if an 'X' is clicked)
    document.getElementById('modalAssessmentList').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-row-btn')) {
            e.target.closest('.assessment-row').remove();
        }
    });

    // Send data to MongoDB!
    document.getElementById('saveAssessmentsBtn').addEventListener('click', saveAssessmentsToDatabase);
}

async function saveAssessmentsToDatabase() {
    const courseId = document.getElementById('modalCourseId').value;
    const rows = document.querySelectorAll('.assessment-row');
    
    let newCategories = [];
    let totalWeight = 0;

    // Loop through all the rows and scoop up the data
    rows.forEach(row => {
        const name = row.querySelector('.cat-name').value.trim();
        const weight = Number(row.querySelector('.cat-weight').value);
        if (name && weight > 0) {
            newCategories.push({ name, weight });
            totalWeight += weight;
        }
    });

    // Optional Safety Check
    if (totalWeight !== 100) {
        const proceed = confirm(`Warning: Your total weight adds up to ${totalWeight}%. It usually should be 100%. Do you still want to save?`);
        if (!proceed) return;
    }

    const token = localStorage.getItem('token');
    
    try {
        // Send the PUT request to the route we just built!
        const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ categories: newCategories })
        });

        if (response.ok) {
            document.getElementById('assessmentModal').style.display = 'none';
            fetchAdminCourses(); // Redraw the dashboard so the changes show up instantly!
        } else {
            const err = await response.json();
            alert("Failed to save: " + err.message);
        }
    } catch (error) {
        console.error(error);
        alert("Server error while saving.");
    }
}
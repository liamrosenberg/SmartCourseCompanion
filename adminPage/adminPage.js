let globalCourses = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminCourses();
    setupModalListeners();
});

async function fetchAdminCourses() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = "../landingPage.html"; return; }

    try {
        const response = await fetch('http://localhost:5000/api/courses/all', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            globalCourses = await response.json();
            renderCourses(globalCourses);
            updateDashboardStats(globalCourses); 
            setupSearchBar();                    
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
        courseCard.id = `course-card-${course.courseCode.toLowerCase()}`;
        
        courseCard.innerHTML = `
            <div class="card-header flex-between" style="align-items: center; margin-bottom: 15px;">
                <div>
                    <h3 class="card-title" style="margin: 0;">${course.courseName}</h3>
                    <h4 class="text-secondary" style="margin: 5px 0 0 0;">ID: ${course.courseCode}</h4>
                </div>
                <button class="btn btn-tertiary status-btn" data-id="${course._id}" style="background-color: ${btnColor}; color: white; padding: 5px 15px; border-radius: 4px; border: none; cursor: pointer;">${btnText}</button>
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
                <div class="button-group mt-md" style="justify-content: flex-start; margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn btn-secondary edit-assessments-btn" data-id="${course._id}">Edit Assessments</button>
                    <button class="btn delete-course-btn" data-id="${course._id}" style="background-color: transparent; color: #ff3838; border: 1px solid #ff3838; padding: 5px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">Delete Course</button>
                </div>
            </div>
        `;
        container.appendChild(courseCard);
    });

    attachCardButtonLogic();
}

function attachCardButtonLogic() {
    // 1. Status Logic (Enable/Disable)
    const statusBtns = document.querySelectorAll('.status-btn');
    statusBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            const courseId = this.getAttribute('data-id');
            const currentStatus = this.innerText === 'Enabled';
            const newStatus = !currentStatus;

            this.innerText = newStatus ? 'Enabled' : 'Disabled';
            this.style.backgroundColor = newStatus ? '#30d630' : '#ff3838';

            const courseIndex = globalCourses.findIndex(c => c._id === courseId);
            if (courseIndex !== -1) {
                globalCourses[courseIndex].isActive = newStatus;
                updateDashboardStats(globalCourses); 
            }

            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: newStatus })
                });
                if (!response.ok) throw new Error("Database failed to update");
            } catch (error) {
                console.error(error);
                alert("Failed to save status. Reverting back.");
                this.innerText = currentStatus ? 'Enabled' : 'Disabled';
                this.style.backgroundColor = currentStatus ? '#30d630' : '#ff3838';
                if (courseIndex !== -1) {
                    globalCourses[courseIndex].isActive = currentStatus;
                    updateDashboardStats(globalCourses);
                }
            }
        });
    });

    // 2. Edit Assessments Logic
    const editAssessmentsBtns = document.querySelectorAll('.edit-assessments-btn');
    editAssessmentsBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const courseId = this.getAttribute('data-id');
            openModal(courseId);
        });
    });

    // 3. NEW: Delete Course Logic
    const deleteCourseBtns = document.querySelectorAll('.delete-course-btn');
    deleteCourseBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            const courseId = this.getAttribute('data-id');
            
            // Safety check!
            const confirmDelete = confirm("Are you sure you want to permanently delete this course? This action cannot be undone.");
            if (!confirmDelete) return;

            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    // Remove the course from our array
                    globalCourses = globalCourses.filter(c => c._id !== courseId);
                    
                    // Redraw the dashboard and update the stats instantly
                    renderCourses(globalCourses);
                    updateDashboardStats(globalCourses);
                } else {
                    const err = await response.json();
                    alert("Failed to delete course: " + err.message);
                }
            } catch (error) {
                console.error(error);
                alert("Server error while deleting course.");
            }
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
    list.innerHTML = ''; 
    
    if (course.categories) {
        course.categories.forEach(cat => {
            list.insertAdjacentHTML('beforeend', createRow(cat.name, cat.weight));
        });
    }
    document.getElementById('assessmentModal').style.display = 'flex';
}

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
    document.getElementById('closeModalBtn').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('cancelModalBtn').addEventListener('click', () => modal.style.display = 'none');

    document.getElementById('addRowBtn').addEventListener('click', () => {
        document.getElementById('modalAssessmentList').insertAdjacentHTML('beforeend', createRow());
    });

    document.getElementById('modalAssessmentList').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-row-btn')) {
            e.target.closest('.assessment-row').remove();
        }
    });

    document.getElementById('saveAssessmentsBtn').addEventListener('click', saveAssessmentsToDatabase);
}

async function saveAssessmentsToDatabase() {
    const courseId = document.getElementById('modalCourseId').value;
    const rows = document.querySelectorAll('.assessment-row');
    
    let newCategories = [];
    let totalWeight = 0;

    rows.forEach(row => {
        const name = row.querySelector('.cat-name').value.trim();
        const weight = Number(row.querySelector('.cat-weight').value);
        if (name && weight > 0) {
            newCategories.push({ name, weight });
            totalWeight += weight;
        }
    });

    if (totalWeight !== 100) {
        const proceed = confirm(`Warning: Your total weight adds up to ${totalWeight}%. It usually should be 100%. Do you still want to save?`);
        if (!proceed) return;
    }

    const token = localStorage.getItem('token');
    
    try {
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
            fetchAdminCourses(); 
        } else {
            const err = await response.json();
            alert("Failed to save: " + err.message);
        }
    } catch (error) {
        console.error(error);
        alert("Server error while saving.");
    }
}

// ==========================================
// TOP DASHBOARD LOGIC (STATS & SEARCH)
// ==========================================

function updateDashboardStats(courses) {
    const activeCourses = courses.filter(course => course.isActive);
    const activeCountElement = document.getElementById('stat-active-courses');
    if (activeCountElement) activeCountElement.innerText = activeCourses.length;

    let totalMidtermWeight = 0;
    let midtermCount = 0;

    activeCourses.forEach(course => {
        if (course.categories && course.categories.length > 0) {
            const midterm = course.categories.find(cat => cat.name.toLowerCase().includes('midterm'));
            if (midterm) {
                totalMidtermWeight += midterm.weight;
                midtermCount++;
            }
        }
    });

    const avgMidterm = midtermCount > 0 ? Math.round(totalMidtermWeight / midtermCount) : 0;
    const midtermElement = document.getElementById('stat-midterm-weight');
    if (midtermElement) midtermElement.innerText = `${avgMidterm}%`;

    const completionElement = document.getElementById('stat-completion');
    if (completionElement) completionElement.innerText = "N/A"; 
}

function setupSearchBar() {
    const searchInput = document.getElementById('courseSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.trim().toLowerCase();
                if (query === "") return;

                const targetCard = document.getElementById(`course-card-${query}`);
                
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.style.transition = "box-shadow 0.3s ease";
                    targetCard.style.boxShadow = "0 0 20px #30d630"; 
                    setTimeout(() => { targetCard.style.boxShadow = "none"; }, 2000);
                } else {
                    alert(`Course ID "${query.toUpperCase()}" not found on this dashboard.`);
                }
            }
        });
    }
}
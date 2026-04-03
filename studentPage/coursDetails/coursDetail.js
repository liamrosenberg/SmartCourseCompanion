// GLOBAL SCOPE: All functions can see these
let myCourses = [];
// This acts as the bridge between your page
let courseGrades = {};
let calendar; 

//specific course colors
const courseColors = {
    "SOEN 287": "#2563eb", // Blue
    "COMP 249": "#10b981", // Green
    "ENGR 233": "#f59e0b", // Orange
    "ENGR 213": "#8b5cf6", // Purple
    "MATH 205": "#ef4444", // Red
    "General":  "#64748b"  // Slate Gray
};

//master array with all the classes 
let allAssessments = [];

async function loadDataFromServer() {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    const userId = userData ? userData.id : null;

    if (!userId) return;

    try {
        // 1. Fetch this user's assessments for the Calendar
        // Route is GET /api/assessments/:userId — must pass the logged-in user's ID
        const res = await fetch(`http://localhost:5000/api/assessments/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const rawAssessments = await res.json();

        // Map DB field names (dueDate, courseCode) to what the calendar expects (date, course)
        // dueDate is an ISO string like "2026-04-15T00:00:00.000Z" — slice to "YYYY-MM-DD"
        allAssessments = Array.isArray(rawAssessments) ? rawAssessments.map(a => ({
            ...a,
            date: a.dueDate ? a.dueDate.substring(0, 10) : null,
            course: a.courseCode
        })) : [];

        // 2. Fetch only the courses this user is enrolled in (not all courses)
        // Route is GET /api/courses/enrolled/:userId
        const courseRes = await fetch(`http://localhost:5000/api/courses/enrolled/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coursesData = await courseRes.json();
        myCourses = Array.isArray(coursesData) ? coursesData.map(c => c.courseCode) : [];

        // 3. Refresh the UI
        populateTabs();
        populateCourseDropdown();
        updateCalendarView('All Courses');

    } catch (err) {
        console.error("Failed to load data:", err);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadDataFromServer();
    populateCourseDropdown();
    populateTabs();
    
    var calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 650,
        selectable: true,
        dateClick: function(info) {
            // 1. Hide the Add Form and Grade Form
            document.getElementById('assessment-card').style.display = 'none';
            const gradeCard = document.getElementById('grade-card');
            if (gradeCard) gradeCard.style.display = 'none';
            
            // 2. Show the Daily Overview card
            const dailyCard = document.getElementById('daily-info-card');
            dailyCard.style.display = 'block';
            dailyCard.setAttribute('data-selected-date', info.dateStr); // Save the date

            document.getElementById('daily-info-subtitle').innerText = "Tasks for " + info.dateStr;

            // 3. Find events for this specific day
            const eventsToday = allAssessments.filter(a => a.date === info.dateStr);
            const listContainer = document.getElementById('daily-event-list');
            listContainer.innerHTML = ''; // Clear out old data

            // 4. Draw the tasks on the screen!
            if (eventsToday.length === 0) {
                listContainer.innerHTML = '<p class="text-muted" style="margin-bottom: 20px;">No tasks scheduled for this day.</p>';
            } else {
                eventsToday.forEach(event => {
                    let blockColor = courseColors[event.course] || '#2563eb';
                    listContainer.innerHTML += `
                        <div class="task-item" style="border-left: 4px solid ${blockColor}; padding-left: 12px;">
                            <div>
                                <h4 style="margin: 0; color: #1e293b;">${event.course}: ${event.name}</h4>
                                <p class="text-secondary" style="margin: 4px 0 0 0; font-size: 0.9rem;">${event.description || 'No description provided.'}</p>
                            </div>
                            
                            <div class="task-actions">
                                <button class="action-btn edit-btn" onclick="editTask('${event.name}', '${info.dateStr}')" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </button>
                                <button class="action-btn delete-btn" onclick="deleteTask('${event.name}', '${info.dateStr}', this)" title="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    `;
                });
            }
            window.dispatchEvent(new Event('resize'));
        
        },
        events: [] 
    });
    calendar.render();
    updateCalendarView('All Courses');
});

async function saveNewAssessment() {
    const token = localStorage.getItem('token');
    const assessmentCard = document.getElementById('assessment-card');
    const name = document.getElementById('assessment-name-input').value;
    const desc = document.getElementById('assessment-desc-input').value; 
    const course = document.getElementById('assessment-course-select').value;
    const date = assessmentCard.getAttribute('data-selected-date');

    if (!name || !course || !date) {
        alert("Please fill in the name and select a course!");
        return;
    }

    // NEW: Send the task to Liam's server to be saved in MongoDB
    try {
        await fetch('http://localhost:5000/api/assessments', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                name: name,
                description: desc,
                dueDate: date, // Matches Ray's model name
                courseCode: course
            })
        });

        // After saving, reload everything from the server so the calendar updates
        await loadDataFromServer();

        // Reset UI
        document.getElementById('assessment-name-input').value = '';
        document.getElementById('assessment-desc-input').value = '';
        assessmentCard.style.display = 'none';
        document.getElementById('daily-info-card').style.display = 'block';
        window.dispatchEvent(new Event('resize'));

    } catch (err) {
        console.error("Error saving assessment:", err);
    }
}

// 3. TAB LOGIC: Controls what cards are visible
function switchTab(clickedButton, courseName) {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('btn-primary');
        tab.classList.add('btn-secondary');
    });
    clickedButton.classList.remove('btn-secondary');
    clickedButton.classList.add('btn-primary');

    const gradeCard = document.getElementById('grade-card');
    const assessmentCard = document.getElementById('assessment-card');

    const titleDisplay = document.getElementById('course-title-display');
    if (titleDisplay) {
        titleDisplay.innerText = courseName === 'All' ? 'All Courses' : courseName;
    }

    if (courseName === 'All') {
        gradeCard.style.display = 'none';
        assessmentCard.style.display = 'none';
    } else {
        gradeCard.style.display = 'block';
        const dropdown = document.getElementById('assessment-course-select');
        if (dropdown) dropdown.value = courseName;
    }
    window.dispatchEvent(new Event('resize'));
    updateCalendarView(courseName);
    updateCourseAverage(courseName);
}

// 4. DYNAMIC UI LOADERS
function populateCourseDropdown(){
    const select = document.getElementById('assessment-course-select');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Select a course...</option>'; 
    //will allow to add task to general course
    select.innerHTML += '<option value="General">General</option>';

    myCourses.forEach(course => {
        let option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        select.appendChild(option);
    });
}

function populateTabs(){
    const tabContainer = document.getElementById('dynamic-tabs');
    if (!tabContainer) return;
    tabContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'btn btn-secondary tab-btn';
    allBtn.textContent = 'All Courses';
    allBtn.onclick = function() { switchTab(this, 'All'); };
    tabContainer.appendChild(allBtn);

    myCourses.forEach(course => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary tab-btn';
        btn.textContent = course;
        btn.onclick = function() { switchTab(this, course); };
        tabContainer.appendChild(btn);
    });
}

function updateCalendarView(courseName){
    //wiping the calender clean 
    calendar.removeAllEvents();
    //going trough the master array to see what needs to be displayed
    let eventsToShow = [];
    if (courseName === "All" || courseName === "All Courses") { //if all are selected we display all the events
        eventsToShow = allAssessments;
    } else {
        eventsToShow = allAssessments.filter(assessment => assessment.course === courseName)
    }
    //now we show the filtered events on the calender 
    eventsToShow.forEach(assessment => {
        //ex. if "All courses" we will se SOEN 287: Quiz 1, if a specific tab then simply Quiz 1
        let displayTitle = (courseName === 'All' || courseName === 'All Courses')
            ? `${assessment.course}: ${assessment.name}` //if true 
            : assessment.name //else
        //now we get the correct color for the course
        let blockColor = courseColors[assessment.course] || '#2563eb'

        calendar.addEvent({
            title: displayTitle,
            start: assessment.date,
            allDay: true,
            backgroundColor: blockColor,
            borderColor: blockColor
        });
    });
}

//this function will allow swap between daily schedule and add event
function showAddAssessmentForm() {
    const dailyCard = document.getElementById('daily-info-card');
    const date = dailyCard.getAttribute('data-selected-date');

    // Guard: user must click a calendar date before adding an assessment
    if (!date) {
        alert('Please click a date on the calendar first.');
        return;
    }

    //hiding the daily view and show form
    dailyCard.style.display = 'none';
    const assessmentCard = document.getElementById('assessment-card');
    assessmentCard.style.display = 'block';

    //passing the new data to the form
    assessmentCard.setAttribute('data-selected-date', date);
    document.getElementById('selected-date-header').innerText = "Add Assessment";
    document.getElementById('selected-date-subtitle').innerText = "Scheduling for: " + date;
}

// Function to delete tasks from the list and calendar
function deleteTask(taskName, taskDate, btnElement) {
    // 1. Ask for confirmation
    if(confirm(`Are you sure you want to delete "${taskName}"?`)) {
        
        // 2. Remove it from your master database array
        allAssessments = allAssessments.filter(task => !(task.name === taskName && task.date === taskDate));
        
        // 3. Smoothly fade it out, then delete it from the screen
        const taskBlock = btnElement.closest('.task-item');
        taskBlock.style.opacity = '0';
        
        setTimeout(() => {
            taskBlock.remove();
            
            // If that was the last task, put the "No tasks" text back
            const listContainer = document.getElementById('daily-event-list');
            if (listContainer.children.length === 0) {
                listContainer.innerHTML = '<p class="text-muted" style="margin-bottom: 20px;">No tasks scheduled for this day.</p>';
            }
        }, 200); 
        
        // 4. Wipe it off the actual calendar grid
        let activeTabBtn = document.querySelector('.tab-btn.btn-primary');
        let activeTab = activeTabBtn ? activeTabBtn.textContent : 'All Courses';
        updateCalendarView(activeTab);
    }
}

// Function to pull task data back into the form for editing
function editTask(taskName, taskDate) {
    // 1. Find the original task in your database array
    const taskToEdit = allAssessments.find(task => task.name === taskName && task.date === taskDate);
    if (!taskToEdit) return; // Failsafe

    // 2. Paste the data back into your input boxes
    document.getElementById('assessment-name-input').value = taskToEdit.name;
    document.getElementById('assessment-desc-input').value = taskToEdit.description || '';
    document.getElementById('assessment-course-select').value = taskToEdit.course;

    // 3. Swap the side panels
    document.getElementById('daily-info-card').style.display = 'none';
    const assessmentCard = document.getElementById('assessment-card');
    assessmentCard.style.display = 'block';

    // 4. Update the headers to say "Edit" instead of "Add"
    assessmentCard.setAttribute('data-selected-date', taskDate);
    document.getElementById('selected-date-header').innerText = "Edit Assessment";
    document.getElementById('selected-date-subtitle').innerText = "Updating task for: " + taskDate;

    // 5. Delete the OLD version from the array!
    // (This way, when you hit "Save", it pushes the new version instead of a duplicate)
    allAssessments = allAssessments.filter(task => !(task.name === taskName && task.date === taskDate));
    
    // 6. Refresh the calendar to clear the old block while you edit
    let activeTabBtn = document.querySelector('.tab-btn.btn-primary');
    let activeTab = activeTabBtn ? activeTabBtn.textContent : 'All Courses';
    updateCalendarView(activeTab);
}

async function saveNewGrade() {
    const token = localStorage.getItem('token');
    const activeTabBtn = document.querySelector('.tab-btn.btn-primary');
    const courseCode = activeTabBtn.textContent;

    const payload = {
        courseCode: courseCode,
        name: document.getElementById('grade-name-input').value,
        earnedMarks: parseFloat(document.getElementById('earned').value),
        totalMarks: parseFloat(document.getElementById('total').value)
    };

    const response = await fetch('http://localhost:5000/api/assessments/add-grade', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    // Use the average the SERVER calculated 
    document.getElementById('average-display').innerText = result.serverCalculatedAverage + "%";
}

async function updateCourseAverage(courseName) {
    const display = document.getElementById('average-display');
    const token = localStorage.getItem('token');

    if (courseName === 'All Courses' || courseName === 'All') {
        display.innerText = "Dashboard View"; // Or a general avg if you want to write a route for it
        return;
    }

    // Ask the server for the calculation
    const response = await fetch(`http://localhost:5000/api/assessments/average/${courseName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    display.innerText = data.average + "%";
}
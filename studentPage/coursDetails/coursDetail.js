// GLOBAL SCOPE: All functions can see these
const myCourses = ["SOEN 287", "COMP 249", "ENGR 233", "ENGR 213", "MATH 205"];
// This acts as the bridge between your page
let courseGrades = JSON.parse(localStorage.getItem('sharedCourseGrades')) || {
    "SOEN 287": [],
    "COMP 249": [],
    "ENGR 233": [],
    "ENGR 213": [],
    "MATH 205": []
};
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
let allAssessments = [
    { name: 'Quiz 1', date: '2026-03-05', course: 'SOEN 287' },
    { name: 'Midterm', date: '2026-03-12', course: 'COMP 249' },
    { name: 'Assignment 1', date: '2026-03-20', course: 'ENGR 233' }
];

document.addEventListener('DOMContentLoaded', function() {
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

function saveNewAssessment() {
    const assessmentCard = document.getElementById('assessment-card');
    const name = document.getElementById('assessment-name-input').value;
    const desc = document.getElementById('assessment-desc-input').value; 
    const course = document.getElementById('assessment-course-select').value;
    const date = assessmentCard.getAttribute('data-selected-date');

    if (!name || !course || !date) {
        alert("Please fill in the name and select a course!");
        return;
    }

    // 1. Push to master array
    allAssessments.push({
        name: name,
        description: desc,
        date: date,
        course: course
    });

    // 2. SAFETY NET: Find active tab, default to 'All Courses' if none are clicked
    const activeTabBtn = document.querySelector('.tab-btn.btn-primary');
    const activeTab = activeTabBtn ? activeTabBtn.textContent : 'All Courses';
    
    // Instantly draw to the calendar
    updateCalendarView(activeTab); 

    // 3. Instantly update the Daily Overview list (The SMART way)
    const listContainer = document.getElementById('daily-event-list');
    listContainer.innerHTML = ''; // Completely wipe the old HTML clean!

    // Find all events for this specific day in the master array
    const eventsToday = allAssessments.filter(a => a.date === date);

    if (eventsToday.length === 0) {
        listContainer.innerHTML = '<p class="text-muted" style="margin-bottom: 20px;">No tasks scheduled for this day.</p>';
    } else {
        // Redraw every task for today from scratch so there are zero duplicates
        eventsToday.forEach(event => {
            let blockColor = courseColors[event.course] || '#2563eb';
            listContainer.innerHTML += `
                <div class="task-item" style="border-left: 4px solid ${blockColor}; padding-left: 12px;">
                    <div>
                        <h4 style="margin: 0; color: #1e293b;">${event.course}: ${event.name}</h4>
                        <p class="text-secondary" style="margin: 4px 0 0 0; font-size: 0.9rem;">${event.description || 'No description provided.'}</p>
                    </div>
                    
                    <div class="task-actions">
                        <button class="action-btn edit-btn" onclick="editTask('${event.name}', '${event.date}')" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteTask('${event.name}', '${event.date}', this)" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    // 4. Reset inputs
    document.getElementById('assessment-name-input').value = '';
    document.getElementById('assessment-desc-input').value = '';
    
    // 5. Hide form and instantly go back to the newly updated Daily View
    assessmentCard.style.display = 'none';
    document.getElementById('daily-info-card').style.display = 'block';
    
    window.dispatchEvent(new Event('resize'));
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

    //hiding the daily view and show form 
    dailyCard.style.display = 'none'
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

function saveNewGrade() {
    // 1. Find out which tab is currently selected
    let activeTabBtn = document.querySelector('.tab-btn.btn-primary');
    if (!activeTabBtn || activeTabBtn.textContent === 'All Courses') {
        alert("Please select a specific course tab before adding a grade!");
        return;
    }
    let courseName = activeTabBtn.textContent;

    // 2. Grab the inputs (FIXED THE IDs HERE to match your HTML!)
    let name = document.getElementById('grade-name-input').value;
    let earned = parseFloat(document.getElementById('earned').value);
    let total = parseFloat(document.getElementById('total').value);

    if (!name || isNaN(earned) || isNaN(total)) {
        alert("Please fill in all grade fields with valid numbers.");
        return;
    }

    // 3. Save it to the array
    courseGrades[courseName].push({ name: name, earned: earned, total: total });

    // 4. PUSH TO THE BROWSER MEMORY (This is what Raymond's file will read!)
    localStorage.setItem('sharedCourseGrades', JSON.stringify(courseGrades));

    // 5. Update your top header instantly
    updateCourseAverage(courseName);

    // 6. Clear inputs
    document.getElementById('grade-name-input').value = '';
    document.getElementById('earned').value = '';
    document.getElementById('total').value = '';
}

function updateCourseAverage(courseName) {
    const display = document.getElementById('average-display');
    
    // --- NEW: THE "ALL COURSES" OVERALL AVERAGE ---
    if (courseName === 'All Courses' || courseName === 'All') {
        let totalPercentages = 0;
        let activeCourses = 0;

        // Loop through every course in your database
        for (let course in courseGrades) {
            let grades = courseGrades[course];
            
            if (grades && grades.length > 0) {
                let courseWeight = 0;
                let courseSum = 0;

                // Calculate this specific course's average
                grades.forEach(g => {
                    courseWeight += g.total;
                    courseSum += (g.earned * g.total);
                });

                // Add this course's average to our grand total
                if (courseWeight > 0) {
                    totalPercentages += (courseSum / courseWeight);
                    activeCourses++;
                }
            }
        }

        // If you have no grades in ANY course yet
        if (activeCourses === 0) {
            display.innerText = '--%';
        } else {
            // Divide the sum of course averages by the number of active courses
            let overall = (totalPercentages / activeCourses).toFixed(1);
            display.innerText = overall + '%';
        }
        return;
    }

    // --- EXISTING: INDIVIDUAL COURSE AVERAGE ---
    let grades = courseGrades[courseName];
    if (!grades || grades.length === 0) {
        display.innerText = '--%';
        return;
    }

    let totalWeight = 0;
    let weightedSum = 0;
    
    grades.forEach(g => {
        totalWeight += g.total; 
        weightedSum += (g.earned * g.total); 
    });

    if (totalWeight === 0) {
        display.innerText = '--%';
        return;
    }

    let average = (weightedSum / totalWeight).toFixed(1); 
    display.innerText = average + '%';
}
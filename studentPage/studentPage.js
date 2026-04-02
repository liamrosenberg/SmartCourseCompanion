// ==================
// CHECK AUTHENTICATION
// ===================

// check if user logged in
if (!AUTH.isLoggedIn()){
    window.location.href = '../login-registration/landingPage.html';
}

const API_URL = 'http://localhost:5000';
const user = AUTH.getUser();

// =================
// Fetch dashboard data
// =================

async function loadDashboardData() {
    try {
        // fetch dashboard stats
        const response = await AUTH.fetch(`${API_URL}/api/students/${user.id}/stats`);

        if (!response) return; // Logged out due to auth error

        const stats = await response.json();

        // Update stat cards
        updateStatCards(stats);

        // Update charts with real data
        createChartsWithData(stats);

        // Fetch and display assessments
        loadAssessments();
    } catch (error){
        console.error('Error loading dashboard:', error);
    }
    
}

// ================
// Update stat cards
// ================

function updateStatCards(stats){
    // Update Active Courses
    document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = stats.activeCourses;

    // Update Overall avg
    document.querySelector('.stat-card:nth-child(2) .stat-number').textContent =
    stats.overallAverage > 0 ? `${stats.overallAverage}%` : '--';

    // Update Pending Assessments
    document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = stats.pendingAssessments;
}

// =============
// Load assessments
// ==============

async function loadAssessments(){
    try{
        const response = await AUTH.fetch(`${API_URL}/api/assessments/${user.id}`);

        if(!response) return;

        const assessments = await response.json();

        // Display first 3 assessments (show all later)
        displayAssessments(assessments.slice(0, 3));
    } catch(error){
        console.error('Erorr loading assessments:', error);
    }
}

function displayAssessments(assessments){
    const assessmentList = document.querySelector('.assessment-list');

    if (assessments.length === 0){
        assessmentList.innerHTML = '<p class="text-secondary">No assessments yet. Enroll in courses to get started!</p>';
        return;
    }

    assessmentList.innerHTML = assessments.map(assessment => {
        const status = assessment.isCompleted ? 'success' : 'warning';
        const statusText = assessment.isCompleted ? 'Completed' : 'Pending';
        const dueDate = assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'No due date';

        return `
        <div class="assessment-item">
            <div class="flex-between">
                <div>
                    <h4>${assessment.courseCode} - ${assessment.name}</h4>
                    <p class="text-secondary">${assessment.description || 'No description'}</p>
                </div>
                <div class="text-right">
                    <span class="badge badge-${status}">${statusText}</span>
                    <p class="text-secondary mt-sm">Due: ${dueDate}</p>
                </div>
            </div>
        </div>
        `;
    }).join('');
}




document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard data when page loads
    loadDashboardData();
});

// ============================================
// CHARTS WITH REAL DATA
// ============================================

function createChartsWithData(stats) {
    // Create bar chart with real course averages
    createBarChartWithData(stats.courseAverage);
    
    // Create doughnut chart with real assessment progress
    createDoughnutChartWithData(stats.assessmentProgress);
}

function createBarChartWithData(courseAverages) {
    const courseGradesCtx = document.getElementById('courseGradesChart');
    
    if (!courseGradesCtx) return;
    
    // Convert courseAverages object to arrays
    const courseCodes = Object.keys(courseAverages);
    const averages = courseCodes.map(code => parseFloat(courseAverages[code].average));
    
    // If no data, show placeholder
    if (courseCodes.length === 0) {
        courseCodes.push('No Courses');
        averages.push(0);
    }
    
    new Chart(courseGradesCtx, {
        type: 'bar',
        data: {
            labels: courseCodes,
            datasets: [{
                label: 'Current Average (%)',
                data: averages,
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function createDoughnutChartWithData(assessmentProgress) {
    const assessmentProgressCtx = document.getElementById('assessmentProgressChart');
    
    if (!assessmentProgressCtx) return;
    
    new Chart(assessmentProgressCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending', 'Overdue'],
            datasets: [{
                label: 'Assessment Progress',
                data: [
                    assessmentProgress.completed,
                    assessmentProgress.pending,
                    assessmentProgress.overdue
                ],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',  // Green
                    'rgba(245, 158, 11, 0.8)',  // Yellow  
                    'rgba(239, 68, 68, 0.8)'    // Red
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
// ==================
// CHECK AUTHENTICATION
// ===================

// check if user logged in
if (!AUTH.isLoggedIn()){
    window.location.href = '../login-registration/landingPage.html';
}

const API_URL = 'http://localhost:5000';
const user = AUTH.getUser();


let currentAssessments = [];

let allFetchedAssessments = [];


let barChart = null;
let doughnutChart = null;

// =================
// Fetch dashboard data
// =================

async function loadDashboardData() {
    try {
        // fetch dashboard stats
        const response = await AUTH.fetch(`${API_URL}/api/students/${user.id}/stats`);

        if (!response) return; // Logged out due to auth error

        if (!response.ok) {
            console.error('Stats request failed:', response.status);
            return;
        }

        const stats = await response.json();

        // Update stat cards
        updateStatCards(stats);

        // Update charts with real data
        createChartsWithData(stats);

        // Fetch and display assessments
        await loadAssessments();
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

        // Cache full list for cumulative worth validation
        allFetchedAssessments = assessments;
        // Cache displayed slice so the edit form can read field values
        currentAssessments = assessments.slice(0, 3);
        displayAssessments(currentAssessments);
    } catch(error){
        console.error('Erorr loading assessments:', error);
    }
}

function displayAssessments(assessments){
    const assessmentList = document.querySelector('.assessment-list');

    if (!assessmentList) return;

    if (assessments.length === 0) {
        assessmentList.innerHTML = '<p class="text-secondary" style="text-align: center; padding: 2rem;">No assessments yet.</p>';
        return;
    }

    assessmentList.innerHTML = assessments.map(assessment => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const isOverdue = !assessment.isCompleted && assessment.dueDate &&
            (() => { const d = new Date(assessment.dueDate); d.setHours(0, 0, 0, 0); return d < today; })();
        const status = assessment.isCompleted ? 'success' : isOverdue ? 'danger' : 'warning';
        const statusText = assessment.isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending';
        const dueDateStr = assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'No due date';
        const dueDate = dueDateStr;
        const id = AUTH.escapeHtml(assessment._id);

        // Use AUTH.escapeHtml on all user-supplied fields
        return `
        <div class="assessment-item" data-assessment-id="${id}">
            <div class="flex-between">
                <div>
                    <h4>${AUTH.escapeHtml(assessment.courseCode)} - ${AUTH.escapeHtml(assessment.name)}</h4>
                    <p class="text-secondary">${AUTH.escapeHtml(assessment.description) || 'No description'}</p>
                </div>
                <div class="text-right">
                    <span class="badge badge-${status}">${statusText}</span>
                    <p class="${isOverdue ? '' : 'text-secondary'} mt-sm" style="${isOverdue ? 'color: #ef4444;' : ''}">Due: ${dueDate}</p>
                    <div style="margin-top: 0.5rem; display: flex; gap: 0.4rem; justify-content: flex-end;">
                        ${(assessment.source === 'assessment' || (assessment.source == null && !(assessment.isCompleted && assessment.earnedMarks != null))) ? `<button class="btn btn-secondary" style="padding: 0.2rem 0.6rem; font-size: 0.8rem; color: ${assessment.isCompleted ? '#f59e0b' : '#10b981'}; border-color: ${assessment.isCompleted ? '#f59e0b' : '#10b981'};"
                            data-action="toggle-complete" data-id="${id}">${assessment.isCompleted ? 'Mark Pending' : 'Mark Complete'}</button>` : ''}
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;"
                            data-action="edit" data-id="${id}">Edit</button>
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.6rem; font-size: 0.8rem; color: #ef4444; border-color: #ef4444;"
                            data-action="delete" data-id="${id}">Delete</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}




document.addEventListener('DOMContentLoaded', function() {
    const nameEl = document.getElementById('welcomeName');
    if (nameEl) nameEl.textContent = user.username || 'Student';

    loadDashboardData();

    document.getElementById('exportGradesBtn').addEventListener('click', exportGradesToCSV);

    // handle edit/delete/save/cancel on all assessment items
    const assessmentList = document.querySelector('.assessment-list');
    assessmentList.addEventListener('click', async (e) => {
        
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const id     = button.dataset.id;

        if (action === 'toggle-complete') await toggleAssessmentComplete(id);
        if (action === 'edit')        showEditForm(id);
        if (action === 'delete')      await deleteAssessment(id);
        if (action === 'cancel-edit') displayAssessments(currentAssessments);
        if (action === 'save-edit')   await saveAssessment(id, button.closest('.assessment-item'));
    });
});

// ============================================
// EXPORT GRADES TO CSV
// ============================================
// Fetches ALL of the user's assessments

async function exportGradesToCSV() {
    try {
        const response = await AUTH.fetch(`${API_URL}/api/assessments/${user.id}`);
        if (!response || !response.ok) {
            showToast('Failed to fetch grades.', 'error');
            return;
        }

        const assessments = await response.json();

        if (!assessments.length) {
            showToast('No grades to export yet.', 'error');
            return;
        }

        // CSV header row
        const headers = [
            'Course Code', 'Assessment Name', 'Description',
            'Earned Marks', 'Total Marks', 'Grade (%)', 'Status', 'Due Date'
        ];

        // One row per assessment
        const rows = assessments.map(a => {
            const grade = (a.earnedMarks != null && a.totalMarks > 0)
                ? ((a.earnedMarks / a.totalMarks) * 100).toFixed(1)
                : '--';
            const due    = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '';
            const today  = new Date(); today.setHours(0, 0, 0, 0);
            const isOverdue = !a.isCompleted && a.dueDate &&
                (() => { const d = new Date(a.dueDate); d.setHours(0, 0, 0, 0); return d < today; })();
            const status = a.isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending';

            // Wrap text fields in quotes; for csv format
            const q = str => `"${String(str || '').replace(/"/g, '""')}"`;

            return [
                q(a.courseCode),
                q(a.name),
                q(a.description),
                a.earnedMarks != null ? a.earnedMarks : '',
                a.totalMarks  != null ? a.totalMarks  : '',
                grade,
                status,
                due
            ].join(',');
        });

        const csv  = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);

        // Create a temporary link 
        const filename = `grades_${user.username || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
        const link = document.createElement('a');
        link.href     = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('Grades exported!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed. Please try again.', 'error');
    }
}

// ============================================
// DASHBOARD REFRESH
// ============================================
// Called after any change (edit/delete) so the UI stays in sync without a page reload.

async function refreshDashboard() {
    try {
        const response = await AUTH.fetch(`${API_URL}/api/students/${user.id}/stats`);
        if (!response || !response.ok) return;
        const stats = await response.json();
        updateStatCards(stats);
        createChartsWithData(stats);
        await loadAssessments();
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
    }
}

// ============================================
// ASSESSMENT EDIT / DELETE / TOGGLE
// ============================================

async function toggleAssessmentComplete(id) {
    const a = currentAssessments.find(x => x._id === id);
    if (!a) return;

    try {
        const response = await AUTH.fetch(`${API_URL}/api/assessments/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ isCompleted: !a.isCompleted })
        });

        if (!response) return;

        if (response.ok) {
            showToast(a.isCompleted ? 'Marked as pending.' : 'Marked as complete!', a.isCompleted ? 'warning' : 'success');
            await refreshDashboard();
        } else {
            const data = await response.json();
            showToast(data.message || 'Update failed.', 'error');
        }
    } catch (error) {
        console.error('Error toggling assessment:', error);
        showToast('Failed to update. Please try again.', 'error');
    }
}

function showEditForm(id) {
    const a = currentAssessments.find(x => x._id === id);
    if (!a) return;

    const item = document.querySelector(`.assessment-item[data-assessment-id="${id}"]`);
    if (!item) return;

    item.innerHTML = `
        <div style="padding: 0.25rem 0;">
            <div class="flex-between" style="margin-bottom: 1rem;">
                <h4 style="margin: 0;">Edit Assessment</h4>
                <button class="btn btn-secondary" style="padding: 0.2rem 0.6rem; font-size: 0.85rem;"
                    data-action="cancel-edit">Cancel</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
                <div>
                    <label style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">Name</label>
                    <input type="text" class="search-input" name="name" value="${AUTH.escapeHtml(a.name)}"
                        style="width: 100%; box-sizing: border-box;">
                </div>
                <div>
                    <label style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">Course Code</label>
                    <input type="text" class="search-input" value="${AUTH.escapeHtml(a.courseCode)}"
                        style="width: 100%; box-sizing: border-box;" disabled>
                </div>
                <div>
                    <label style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">Earned Marks</label>
                    <input type="number" class="search-input" name="earnedMarks" value="${a.earnedMarks ?? ''}" min="0"
                        style="width: 100%; box-sizing: border-box;">
                </div>
                <div>
                    <label style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">Worth % (Total)</label>
                    <input type="number" class="search-input" name="totalMarks" value="${a.totalMarks ?? ''}" min="1"
                        style="width: 100%; box-sizing: border-box;">
                </div>
            </div>
            <div style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">Description</label>
                <input type="text" class="search-input" name="description" value="${AUTH.escapeHtml(a.description || '')}"
                    style="width: 100%; box-sizing: border-box;">
            </div>
            <p id="dash-edit-error" style="color:#ef4444;font-size:0.85rem;margin-top:0.5rem;display:none;"></p>
            <button class="btn btn-primary" style="width: 100%;"
                data-action="save-edit" data-id="${AUTH.escapeHtml(a._id)}">Save Changes</button>
        </div>
    `;
}

// Reads the inline form values and PUT /api/assessments/:id
async function saveAssessment(id, container) {
    const errorEl   = container.querySelector('#dash-edit-error');
    const showError = msg => { errorEl.textContent = msg; errorEl.style.display = 'block'; };

    const name = container.querySelector('[name="name"]').value.trim();
    const earnedMarksVal = container.querySelector('[name="earnedMarks"]').value;
    const totalMarksVal  = container.querySelector('[name="totalMarks"]').value;
    const description    = container.querySelector('[name="description"]').value.trim();

    if (!name) { showError('Name cannot be empty.'); return; }

    // Worth % cumulative validation
    if (totalMarksVal !== '') {
        const total = Number(totalMarksVal);
        if (isNaN(total) || total <= 0 || total > 100) {
            showError('Worth % must be between 1 and 100.'); return;
        }
        const current = allFetchedAssessments.find(x => x._id === id);
        const courseCode = current ? current.courseCode : null;
        if (courseCode) {
            const existingWorth = allFetchedAssessments
                .filter(a => a.courseCode === courseCode && (a.source === 'grade' || (a.source == null && a.isCompleted && a.earnedMarks != null)) && a.totalMarks != null && a._id !== id)
                .reduce((sum, a) => sum + a.totalMarks, 0);
            if (existingWorth + total > 100) {
                showError(`Adding ${total}% would exceed 100% for ${courseCode}. You have ${(100 - existingWorth).toFixed(1)}% remaining.`); return;
            }
        }
    }

    try {
        const response = await AUTH.fetch(`${API_URL}/api/assessments/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name,
                description,
                earnedMarks: earnedMarksVal !== '' ? Number(earnedMarksVal) : undefined,
                totalMarks:  totalMarksVal  !== '' ? Number(totalMarksVal)  : undefined
            })
        });

        if (!response) return;

        if (response.ok) {
            showToast('Assessment updated.', 'success');
            await refreshDashboard();
        } else {
            const data = await response.json();
            showError(data.message || 'Update failed.');
        }
    } catch (error) {
        console.error('Error updating assessment:', error);
        showError('Failed to update. Please try again.');
    }
}

// Confirms with the user and DELETE /api/assessments/:id
async function deleteAssessment(id) {
    if (!confirm('Delete this assessment? This cannot be undone.')) return;

    try {
        const response = await AUTH.fetch(`${API_URL}/api/assessments/${id}`, {
            method: 'DELETE'
        });

        if (!response) return;

        if (response.ok) {
            showToast('Assessment deleted.', 'success');
            await refreshDashboard();
        } else {
            const data = await response.json();
            showToast(data.message || 'Delete failed.', 'error');
        }
    } catch (error) {
        console.error('Error deleting assessment:', error);
        showToast('Failed to delete. Please try again.', 'error');
    }
}

// Toast notification  green for success, red for error
function showToast(message, type) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 2rem; right: 2rem;
        padding: 0.875rem 1.5rem; border-radius: 8px;
        color: #fff; font-weight: 500; font-size: 0.95rem; z-index: 9999;
        background-color: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

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
    const courseCodes = Object.keys(courseAverages || {});
    const averages = courseCodes.map(code => parseFloat(courseAverages[code].average));
    
    // placeholder
    if (courseCodes.length === 0) {
        courseCodes.push('No Courses');
        averages.push(0);
    }
    
    if (barChart) barChart.destroy();
    barChart = new Chart(courseGradesCtx, {
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
    
    if (doughnutChart) doughnutChart.destroy();
    doughnutChart = new Chart(assessmentProgressCtx, {
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

// ============================================
// LOGOUT
// ============================================

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = "../login-registration/landingPage.html";
}
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

// ==================
// CHECK AUTHENTICATION
// ==================

if (!AUTH.isLoggedIn()) {
    window.location.href = '../login-registration/landingPage.html';
}

const API_URL = 'http://localhost:5000';
const user = AUTH.getUser();

// =================
// Load Courses
// =================

async function loadCourses(query = '') {
    const courseGrid = document.querySelector('.course-grid');
    courseGrid.innerHTML = '<p class="text-secondary" style="padding: 1rem;">Loading courses...</p>';

    try {
        // Use search endpoint when user has typed a query, otherwise fetch all
        const url = query
            ? `${API_URL}/api/courses/search?q=${encodeURIComponent(query)}`
            : `${API_URL}/api/courses`;

        const response = await AUTH.fetch(url);
        if (!response) return; 

        if (!response.ok) {
            courseGrid.innerHTML = '<p class="text-secondary">Failed to load courses. Please try again.</p>';
            return;
        }

        const courses = await response.json();
        displayCourses(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
        courseGrid.innerHTML = '<p class="text-secondary">Could not reach the server. Is it running?</p>';
    }
}

// =================
// Display Courses
// =================

function displayCourses(courses) {
    const courseGrid = document.querySelector('.course-grid');

    if (courses.length === 0) {
        courseGrid.innerHTML = '<p class="text-secondary" style="padding: 1rem;">No courses found.</p>';
        return;
    }

    courseGrid.innerHTML = courses.map(course => `
        <div class="card course-card">
            <div class="course-header">
                <span class="course-code">${AUTH.escapeHtml(course.courseCode)}</span>
                <span class="badge badge-info">Active</span>
            </div>
            <h3 class="course-title">${AUTH.escapeHtml(course.courseName)}</h3>
            <p class="text-secondary">Instructor: ${AUTH.escapeHtml(course.instructor)}</p>
            <button class="btn btn-primary btn-block" data-course-id="${AUTH.escapeHtml(course._id)}">Add Course</button>
        </div>
    `).join('');
}

// =================
// Enroll in Course
// =================

async function enrollInCourse(courseId) {
    try {
        const response = await AUTH.fetch(`${API_URL}/api/courses/enroll`, {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, courseId })
        });

        if (!response) return; // Redirected to login

        const data = await response.json();

        if (response.ok) {
            showToast(data.message || 'Successfully enrolled!', 'success');
        } else {
            // Includes "Already enrolled in this course" (400) and other errors
            showToast(data.message || 'Enrollment failed.', 'error');
        }
    } catch (error) {
        console.error('Error enrolling in course:', error);
        showToast('Failed to enroll. Please try again.', 'error');
    }
}

// =================
// Toast Notification
// =================

function showToast(message, type) {
    // Remove any existing toast before showing a new one
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message; // textContent

    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 0.875rem 1.5rem;
        border-radius: 8px;
        color: #fff;
        font-weight: 500;
        font-size: 0.95rem;
        z-index: 9999;
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========================
// Load Enrolled Courses
// ========================

async function loadEnrolledCourses() {
    const grid = document.querySelector('.enrolled-courses-grid');
    grid.innerHTML = '<p class="text-secondary" style="padding: 1rem;">Loading...</p>';

    try {
        const response = await AUTH.fetch(`${API_URL}/api/courses/enrolled/${user.id}`);
        if (!response) return;

        if (!response.ok) {
            grid.innerHTML = '<p class="text-secondary">Failed to load enrolled courses.</p>';
            return;
        }

        const courses = await response.json();
        displayEnrolledCourses(courses);
    } catch (error) {
        console.error('Error loading enrolled courses:', error);
        grid.innerHTML = '<p class="text-secondary">Could not reach the server.</p>';
    }
}

function displayEnrolledCourses(courses) {
    const grid = document.querySelector('.enrolled-courses-grid');

    if (courses.length === 0) {
        grid.innerHTML = '<p class="text-secondary" style="padding: 1rem;">You are not enrolled in any courses yet.</p>';
        return;
    }

    grid.innerHTML = courses.map(course => `
        <div class="card course-card">
            <div class="course-header">
                <span class="course-code">${AUTH.escapeHtml(course.courseCode)}</span>
                <span class="badge badge-success">Enrolled</span>
            </div>
            <h3 class="course-title">${AUTH.escapeHtml(course.courseName)}</h3>
            <p class="text-secondary">Instructor: ${AUTH.escapeHtml(course.instructor)}</p>
            <button class="btn btn-secondary btn-block"
                style="color: #ef4444; border-color: #ef4444;"
                data-drop-id="${AUTH.escapeHtml(course._id)}">Drop Course</button>
        </div>
    `).join('');
}

// ========================
// Drop Course
// ========================
// Calls DELETE /api/courses/enroll/:userId/:courseId

async function dropCourse(courseId) {
    if (!confirm('Drop this course? You can re-enroll later.')) return;

    try {
        const response = await AUTH.fetch(`${API_URL}/api/courses/enroll/${user.id}/${courseId}`, {
            method: 'DELETE'
        });

        if (!response) return;

        const data = await response.json();

        if (response.ok) {
            showToast(data.message || 'Course dropped.', 'success');
            // Refresh both lists so the card moves from Enrolled --> Available
            await Promise.all([loadEnrolledCourses(), loadCourses()]);
        } else {
            showToast(data.message || 'Failed to drop course.', 'error');
        }
    } catch (error) {
        console.error('Error dropping course:', error);
        showToast('Failed to drop course. Please try again.', 'error');
    }
}

// =================
// Initialise Page
// =================

document.addEventListener('DOMContentLoaded', () => {
    // Load both lists on page load
    loadEnrolledCourses();
    loadCourses();

    // search
    const searchInput = document.querySelector('.search-input');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadCourses(searchInput.value.trim());
        }, 300);
    });

    // Enroll buttons (available courses grid)
    const courseGrid = document.querySelector('.course-grid');
    courseGrid.addEventListener('click', async (e) => {
        const button = e.target.closest('button[data-course-id]');
        if (button) {
            await enrollInCourse(button.dataset.courseId);
            // Refresh enrolled list so the newly added course appears immediately
            loadEnrolledCourses();
        }
    });

    // Drop buttons (enrolled courses grid)
    const enrolledGrid = document.querySelector('.enrolled-courses-grid');
    enrolledGrid.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-drop-id]');
        if (button) {
            dropCourse(button.dataset.dropId);
        }
    });
});

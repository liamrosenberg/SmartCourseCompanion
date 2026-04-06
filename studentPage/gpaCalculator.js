if (!AUTH.isLoggedIn()) {
    window.location.href = '../login-registration/landingPage.html';
}

// Concordia style letter grade → 4.3-scale GPA points
// Based on percentage ranges
function percentToGradePoints(pct) {
    if (pct >= 90) return 4.3;
    if (pct >= 85) return 4.0;
    if (pct >= 80) return 3.7;
    if (pct >= 75) return 3.3;
    if (pct >= 70) return 3.0;
    if (pct >= 65) return 2.7;
    if (pct >= 60) return 2.3;
    if (pct >= 55) return 2.0;
    if (pct >= 50) return 1.0;
    return 0.0;
}

function percentToLetterGrade(pct) {
    if (pct >= 90) return 'A+';
    if (pct >= 85) return 'A';
    if (pct >= 80) return 'A-';
    if (pct >= 75) return 'B+';
    if (pct >= 70) return 'B';
    if (pct >= 65) return 'B-';
    if (pct >= 60) return 'C+';
    if (pct >= 55) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
}

let rowCount = 0;

function addRow(courseName, grade, credits) {
    rowCount++;
    const tbody = document.getElementById('courseTableBody');
    const tr = document.createElement('tr');
    tr.dataset.rowId = rowCount;
    tr.innerHTML = `
        <td><input type="text" class="search-input" placeholder="e.g. SOEN 287" value="${AUTH.escapeHtml(courseName || '')}"
            style="width: 100%; box-sizing: border-box;"></td>
        <td><input type="number" class="search-input" placeholder="0-100" min="0" max="100" value="${grade !== undefined ? grade : ''}"
            style="width: 100%; box-sizing: border-box;" oninput="updateRowGrade(this)"></td>
        <td><input type="number" class="search-input" placeholder="1-6" min="1" max="6" value="${credits !== undefined ? credits : ''}"
            style="width: 100%; box-sizing: border-box;"></td>
        <td id="letter-${rowCount}" style="text-align: center; font-weight: 500; color: var(--neutral-600);">—</td>
        <td style="text-align: center;">
            <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: #ef4444; border-color: #ef4444;"
                onclick="removeRow(this)">Remove</button>
        </td>
    `;
    tbody.appendChild(tr);

    // If pre-filled grade then show letter right away
    if (grade !== undefined && grade !== '') {
        const letterCell = tr.querySelector(`#letter-${rowCount}`);
        if (letterCell) letterCell.textContent = percentToLetterGrade(Number(grade));
    }
}

function updateRowGrade(input) {
    const tr = input.closest('tr');
    const rowId = tr.dataset.rowId;
    const letterCell = document.getElementById(`letter-${rowId}`);
    if (!letterCell) return;
    const val = parseFloat(input.value);
    letterCell.textContent = (!isNaN(val) && val >= 0 && val <= 100)
        ? percentToLetterGrade(val)
        : '—';
}

function removeRow(btn) {
    btn.closest('tr').remove();
    clearResult();
}

function clearResult() {
    document.getElementById('gpaResult').style.display = 'none';
}

function calculateGPA() {
    const rows = document.querySelectorAll('#courseTableBody tr');
    if (rows.length === 0) {
        showCalcToast('Add at least one course first.', 'error');
        return;
    }

    let weightedSum = 0;
    let totalCredits = 0;
    let hasError = false;

    rows.forEach((tr, i) => {
        const inputs = tr.querySelectorAll('input');
        const pct     = parseFloat(inputs[1].value);
        const credits = parseFloat(inputs[2].value);

        if (isNaN(pct) || pct < 0 || pct > 100) {
            showCalcToast(`Row ${i + 1}: grade must be 0–100.`, 'error');
            hasError = true;
            return;
        }
        if (isNaN(credits) || credits < 1) {
            showCalcToast(`Row ${i + 1}: credits must be at least 1.`, 'error');
            hasError = true;
            return;
        }

        weightedSum  += percentToGradePoints(pct) * credits;
        totalCredits += credits;
    });

    if (hasError) return;

    const gpa = (weightedSum / totalCredits).toFixed(2);
    const resultEl = document.getElementById('gpaResult');
    document.getElementById('gpaValue').textContent = gpa;
    document.getElementById('creditCount').textContent = totalCredits;
    resultEl.style.display = 'block';
}

function showCalcToast(message, type) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 2rem; right: 2rem;
        padding: 0.875rem 1.5rem; border-radius: 8px;
        color: #fff; font-weight: 500; font-size: 0.95rem; z-index: 9999;
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Start with 3 empty rows
    addRow(); addRow(); addRow();
});

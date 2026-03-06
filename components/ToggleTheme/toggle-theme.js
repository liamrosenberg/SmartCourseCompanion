// ============================================
// THEME TOGGLE COMPONENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            // Just toggle the button appearance for now
            this.classList.toggle('active');
        });
    }
});
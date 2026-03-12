const modalOverlay = document.getElementById('modalOverlay');

// Check user selection
function checkSelections() {
    // Current selected user role
    const userRole = document.querySelector('input[name="userRole"]:checked');
    
    // Current selected user action
    const userAction = document.querySelector('input[name="userAction"]:checked');

    // Checks if both user action and user role
    if (userRole && userAction) {
        
        // Adds the 'show-modal' CSS class to the modal overlay, triggering its visibility on screen
        modalOverlay.classList.add('show-modal');

        // Checks if the user indicated they already have an account
        if (userAction.value === "yes") {
            // Displays the login form by setting its CSS display property to 'block'
            document.getElementById("login").style.display = "block";
            // Hides the registration form by setting its CSS display property to 'none'
            document.getElementById("register").style.display = "none";
            
        // Executes if the user indicated they do NOT have an account (value equals "no")
        } else {
            // Hides the login form by setting its CSS display property to 'none'
            document.getElementById("login").style.display = "none";
            // Displays the registration form by setting its CSS display property to 'block'
            document.getElementById("register").style.display = "block";
        }
    }
}

// Defines a function to hide the modal and reset the action selection
function closeModal() {
    // Removes the 'show-modal' CSS class from the overlay, fading it out of view
    modalOverlay.classList.remove('show-modal');

    // Selects all radio buttons related to the user action (Yes/No)
    const actionRadios = document.querySelectorAll('input[name="userAction"]');
    
    // Loops through each of the 'userAction' radio buttons
    actionRadios.forEach(function(radio) {
        // Unchecks the radio button, resetting the user's choice so the modal can trigger again later
        radio.checked = false;
    });
}

// Selects all radio button inputs on the entire page
const allRadios = document.querySelectorAll('input[type="radio"]');

// Loops through every radio button found on the page
allRadios.forEach(function(radio) {
    // Adds an event listener that runs the 'checkSelections' function whenever a radio button's checked state changes
    radio.addEventListener('change', checkSelections);
});

// Selects all HTML elements (the cancel buttons) that have the class 'close-modal-btn'
const closeButtons = document.querySelectorAll('.close-modal-btn');

// Loops through each of the selected close buttons
closeButtons.forEach(function(button) {
    // Adds an event listener that runs the 'closeModal' function whenever a cancel button is clicked
    button.addEventListener('click', closeModal);
});

// Select the forms using the IDs
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Function to handle the redirection
function handleAuthentication(event) {
    // Prevent the default form submission
    event.preventDefault(); 

    // Determine which role the user selected
    const userRole = document.querySelector('input[name="userRole"]:checked');

    if (userRole) {
        // Redirect based on the selected value
        if (userRole.value === "admin") {
            window.location.href = "../adminPage/adminPage.html";
        } else if (userRole.value === "student") {
            window.location.href = "../studentPage/studentDashboard.html";
        }
    }
}

// Attach this function to both forms when the user clicks 'Login' or 'Register'
if (loginForm) {
    loginForm.addEventListener('submit', handleAuthentication);
}

if (registerForm) {
    registerForm.addEventListener('submit', handleAuthentication);
}
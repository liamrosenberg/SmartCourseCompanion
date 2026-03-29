const modalOverlay = document.getElementById('modalOverlay');

// Check user selection
function checkSelections() {
    const userRole = document.querySelector('input[name="userRole"]:checked');
    const userAction = document.querySelector('input[name="userAction"]:checked');

    if (userRole && userAction) {
        modalOverlay.classList.add('show-modal');
        if (userAction.value === "yes") {
            document.getElementById("login").style.display = "block";
            document.getElementById("register").style.display = "none";
        } else {
            document.getElementById("login").style.display = "none";
            document.getElementById("register").style.display = "block";
        }
    }
}

function closeModal() {
    modalOverlay.classList.remove('show-modal');
    const actionRadios = document.querySelectorAll('input[name="userAction"]');
    actionRadios.forEach(radio => radio.checked = false);
}

document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', checkSelections);
});

document.querySelectorAll('.close-modal-btn').forEach(button => {
    button.addEventListener('click', closeModal);
});

// --- NEW AUTHENTICATION LOGIC ---

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// 1. Handle Login
async function handleLogin(event) {
    event.preventDefault(); 

    const username = document.getElementById('loginUsername').value; 
    const password = document.getElementById('loginPassword').value; 
    
    // Grab the value directly from the checked radio button
    const roleElement = document.querySelector('input[name="userRole"]:checked');
    const userRole = roleElement ? roleElement.value : null;

    if (!userRole) {
        alert("Please select if you are a Student or Admin first.");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role: userRole })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (userRole === "admin") {
                window.location.href = "../adminPage/adminPage.html";
            } else {
                window.location.href = "../studentPage/studentDashboard.html";
            }
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Server is offline. Did you run 'node server.js'?");
    }
}

// 2. Handle Registration
async function handleRegister(event) {
    event.preventDefault();

    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const username = document.getElementById('regUsername').value; 
    const email = document.getElementById('regEmail').value;       
    const password = document.getElementById('regPassword').value; 
    const confirm = document.getElementById('confirmPassword').value; 
    
    // Grab the value directly from the checked radio button
    const roleElement = document.querySelector('input[name="userRole"]:checked');
    const userRole = roleElement ? roleElement.value : null;

    if (!userRole) {
        alert("Please select if you are a Student or Admin first.");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username:username , firstName:firstName, lastName:lastName, email: email, password:password, role: userRole })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful! Now please log in.");
            closeModal(); 
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Registration Error:", error);
        alert("Server error. Is 'node server.js' running?");
    }
}

// Attach the new functions to the forms
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (registerForm) registerForm.addEventListener('submit', handleRegister);
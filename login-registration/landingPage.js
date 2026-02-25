const modalOverlay = document.getElementById('modalOverlay');

function checkSelections() {
    const userRole = document.querySelector('input[name="userRole"]:checked');
    const userAction = document.querySelector('input[name="userAction"]:checked');

    if (userRole && userAction) {
        
        modalOverlay.style.display = "flex";

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
    modalOverlay.style.display = "none";

    const actionRadios = document.querySelectorAll('input[name="userAction"]');
    actionRadios.forEach(function(radio) {
        radio.checked = false;
    });
}

const allRadios = document.querySelectorAll('input[type="radio"]');
allRadios.forEach(function(radio) {
    radio.addEventListener('change', checkSelections);
});

const closeButtons = document.querySelectorAll('.close-modal-btn');
closeButtons.forEach(function(button) {
    button.addEventListener('click', closeModal);
});
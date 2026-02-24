function checkSelections(){
    const userRole = document.querySelector('input[name="userRole"]:checked');
    const userAction = document.querySelector('input[name="userAction"]:checked');
    if (userRole && userAction){
        if (userAction.value === "yes"){
            document.getElementById("login").style.display = "block";
            document.getElementById("register").style.display = "none";
        } else {
            document.getElementById("login").style.display = "none";
            document.getElementById("register").style.display = "block";
        }
    }
}

const allRadios = document.querySelectorAll('input[type="radio"]');
allRadios.forEach(radio => {
    radio.addEventListener('change', checkSelections);
});
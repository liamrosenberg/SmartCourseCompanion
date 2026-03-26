function enableDisable(btn){
                                    
                                        if(btn.innerText ==='Enabled'){
                                            btn.innerText='Disabled';
                                            btn.style.backgroundColor = "#ff3838";
                                        }else{
                                            btn.innerText = "Enabled";
                                            btn.style.backgroundColor = "#30d630";
                                        }
                                    }


    const editWeightingsBtn = document.getElementById('edit-weightings-btn');
    const weightValues = document.querySelectorAll('.weight-value');

    editWeightingsBtn.addEventListener('click', function() {
        const isEditing = this.innerText === 'Save Weightings';

        if (isEditing) {
            // Switch back to normal mode (Save)
            weightValues.forEach(span => {
                span.contentEditable = "false";
                span.style.border = "none";
                span.style.padding = "0";
                span.style.backgroundColor = "transparent";
            });
            this.innerText = 'Edit Weightings';
            
            
        } else {
            // Switch to Edit mode
            weightValues.forEach(span => {
                span.contentEditable = "true";
                span.style.border = "1px solid #547eaa"; 
                span.style.padding = "2px 5px";
                span.style.backgroundColor = "#fff";
                span.style.borderRadius = "4px";
            });
            this.innerText = 'Save Weightings';
        }
    });

    // --- Edit Assessments Logic ---
const editAssessmentsBtn = document.getElementById('edit-assessments-btn');
const upcomingAssessmentsContainer = document.getElementById('upcoming-assessments');
const addAssessmentBtn = document.getElementById('add-assessment-btn');

editAssessmentsBtn.addEventListener('click', function() {
    const isEditing = this.innerText === 'Save Assessments';
    
    // We select these dynamically here so it catches any newly added items
    const assessmentItems = document.querySelectorAll('.assessment-item');
    const removeBtns = document.querySelectorAll('.remove-btn');

    if (isEditing) {
        // Switch back to normal mode (Save)
        assessmentItems.forEach(item => {
            item.contentEditable = "false";
            item.style.border = "none";
            item.style.padding = "0";
            item.style.backgroundColor = "transparent";
        });
        
        // Hide add/remove buttons
        removeBtns.forEach(btn => btn.style.display = "none");
        addAssessmentBtn.style.display = "none";
        
        this.innerText = 'Edit Assessments';
    } else {
        // Switch to Edit mode
        assessmentItems.forEach(item => {
            item.contentEditable = "true";
            item.style.border = "1px solid #547eaa";
            item.style.padding = "2px 5px";
            item.style.backgroundColor = "#fff";
            item.style.borderRadius = "4px";
        });
        
        // Show add/remove buttons
        removeBtns.forEach(btn => btn.style.display = "inline-block");
        addAssessmentBtn.style.display = "block";
        
        this.innerText = 'Save Assessments';
    }
});

// --- Add New Assessment Logic ---
addAssessmentBtn.addEventListener('click', function() {
    // Create a new row
    const newRow = document.createElement('div');
    newRow.className = 'assessment-row flex-between';
    newRow.style.alignItems = 'center';
    newRow.style.marginBottom = 'var(--space-sm)';
    
    newRow.innerHTML = `
        <p class="text-secondary assessment-item" contentEditable="true" style="margin: 0; border: 1px solid #547eaa; padding: 2px 5px; background-color: #fff; border-radius: 4px;">New Assessment</p>
        <button class="btn btn-danger remove-btn" style="padding: 2px 8px;">X</button>
    `;
    upcomingAssessmentsContainer.insertBefore(newRow, addAssessmentBtn);
});

// --- Delete Assessment Logic 
upcomingAssessmentsContainer.addEventListener('click', function(e) {
    // Check if the clicked element has the 'remove-btn' class
    if (e.target.classList.contains('remove-btn')) {
        e.target.closest('.assessment-row').remove();
    }
});

    
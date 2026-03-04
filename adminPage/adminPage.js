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
    const assessmentItems = document.querySelectorAll('.assessment-item');

    editAssessmentsBtn.addEventListener('click', function() {
        const isEditing = this.innerText === 'Save Assessments';

        if (isEditing) {
            
            assessmentItems.forEach(item => {
                item.contentEditable = "false";
                item.style.border = "none";
                item.style.padding = "0";
                item.style.backgroundColor = "transparent";
            });
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
            this.innerText = 'Save Assessments';
        }
    });

    
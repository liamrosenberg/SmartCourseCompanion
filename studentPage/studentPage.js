
document.addEventListener('DOMContentLoaded', function() {

    // Chart 1: Course Grades (Bar Chart)

    const courseGradesCtx = document.getElementById('courseGradesChart');
    if(courseGradesCtx){
        new Chart(courseGradesCtx,{
            type: 'bar',
            data: {
                labels: ['SOEN 287', 'COMP 249', 'MATH 205'],
                datasets: [{
                    label: 'Current Average (%)',
                    data: [65, 59, 80],
                    backgroundColor: [ 
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(37, 99, 235, 0.8)'    
            
                    ],
                    borderColor: [
                        'rgba(37, 99, 235, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(96, 165, 250, 1)'
                    ],
                    borderWidth: 1,
                    borderRadius: 6
                }]
            } ,
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
                            callback: function(value){
                                return value + '%';
                            }
                        }
                    }
                }

            }
        });
    }

    // Chart 2 Assessement Progress

    const assessementProgressCtx = document.getElementById('assessmentProgressChart');
    if(assessementProgressCtx){
        new Chart(assessementProgressCtx,{

            type: 'doughnut',
            data: {
                labels: [
                    'Completed',
                    'Pending',
                    'Overdue'
                ],
                datasets: [{
                    label: 'Assessment Progress',
                    data: [1,2,3],
                    backgroundColor:[
                        'rgba(16, 185, 129, 0.8)',  // Green
                        'rgba(245, 158, 11, 0.8)',  // Yellow  
                        'rgba(239, 68, 68, 0.8)'    // Red
                    ],
                    borderColor:[
                        'rgba(16, 185, 129, 1)',  // Green
                        'rgba(245, 158, 11, 1)',  // Yellow  
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options:{
                responsive: true,
                maintainAspectRatio: false,
                plugins:{
                    legend:{
                        position: 'bottom'
                    }
                }
            }
        });
    }
        
});

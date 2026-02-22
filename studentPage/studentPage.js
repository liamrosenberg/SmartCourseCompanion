
document.addEventListener('DOMContentLoaded', function() {

    // Chart 1: Course Grades (Bar Chart)
    function createBarChart(){
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
    }
    

    // Chart 2 Assessement Progress
    function createDoughnutChart(){

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
    }

    // Lazy loading functionality for charts
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                const chartId = entry.target.id;

                if(chartId === 'courseGradesChart'){
                    createBarChart();
                } else if (chartId === 'assessmentProgressChart') {
                    createDoughnutChart();
                }

                // Stop watching after chart loads
                observer.unobserve(entry.target);
            }
        });
    });

    // Start Watching both chart canvases
    observer.observe(document.getElementById('courseGradesChart'));
    observer.observe(document.getElementById('assessmentProgressChart'));
    
        
});

const AUTH = {
    // store token in localStorage
    setToken(token){
        localStorage.setItem('token', token);
    },

    // Get token from localStorage
    getToken(){
        return localStorage.getItem('token');
    },

    // Store user info
    setUser(user){
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Get user info
    getUser(){
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null; 
    },

    // Check if logged in
    isLoggedIn(){
        return !!this.getToken();
    },

    // Logout
    logout(){
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../login-registration/landingPage.html';
    },

    // Escape HTML special characters to prevent XSS when rendering user data into innerHTML
    escapeHtml(str){
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(String(str)));
        return div.innerHTML;
    },

    // Make authenticated api call
    async fetch (url, options = {}){
        const token = this.getToken();

        if(!token){
            this.logout();
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        };

        try {
            const response = await fetch (url,{
                ...options,
                headers
            });

            if(response.status === 401){
                // token expired
                this.logout();
                return;
            }
            
            return response;
        } catch(error){
            console.error('API Error:', error);
            throw error;
        }
    }
};
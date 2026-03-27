// login.js
document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (localStorage.getItem('rafting_auth_token') === 'true') {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple hardcoded check
        if (username === 'admin' && password === 'admin123') {
            // Setup simple token
            localStorage.setItem('rafting_auth_token', 'true');
            // Redirect to dashboard
            window.location.href = 'index.html';
        } else {
            errorMsg.style.display = 'block';
            
            // Shake animation for error
            const loginBox = document.querySelector('.login-box');
            loginBox.classList.add('shake');
            setTimeout(() => {
                loginBox.classList.remove('shake');
            }, 500);
        }
    });

    // Clear error on input
    document.querySelectorAll('.login-container input').forEach(input => {
        input.addEventListener('input', () => {
            errorMsg.style.display = 'none';
        });
    });
});

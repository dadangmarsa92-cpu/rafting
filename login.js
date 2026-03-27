// login.js

// Import Firebase libraries from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDarXUqrsWec0ENj6KsXPu4-frpnSrJJB0",
  authDomain: "rafting-277b7.firebaseapp.com",
  projectId: "rafting-277b7",
  storageBucket: "rafting-277b7.firebasestorage.app",
  messagingSenderId: "81570278149",
  appId: "1:81570278149:web:a61618d2487155af9ea56c",
  measurementId: "G-RH8CWP6E5V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (localStorage.getItem('rafting_auth_token') === 'true') {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.querySelector('.login-btn');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle the eye / eye-off icon
            this.classList.toggle('ri-eye-line');
            this.classList.toggle('ri-eye-off-line');
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        if (!role) {
            showError("Silakan pilih Hak Akses terlebih dahulu.");
            return;
        }

        // Change button state to loading
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Memeriksa... <i class="ri-loader-4-line ri-spin"></i>';
        submitBtn.style.pointerEvents = 'none';
        submitBtn.style.opacity = '0.7';

        try {
            // Query Firestore database
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            let validUser = false;

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                // Verifikasi password dan role
                if (userData.password === password && userData.role === role) {
                    validUser = true;
                }
            });

            if (validUser) {
                // Setup simple token
                localStorage.setItem('rafting_auth_token', 'true');
                localStorage.setItem('rafting_user_role', role);
                localStorage.setItem('rafting_username', username);
                // Redirect to dashboard
                window.location.href = 'index.html';
            } else {
                showError("Username, password, atau hak akses salah!");
            }
        } catch (error) {
            console.error("Error logging in: ", error);
            showError("Terjadi kesalahan koneksi ke server database.");
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalBtnText;
            submitBtn.style.pointerEvents = 'auto';
            submitBtn.style.opacity = '1';
        }
    });

    function showError(msgStr) {
        errorMsg.textContent = msgStr;
        errorMsg.style.display = 'block';
        
        // Shake animation for error
        const loginBox = document.querySelector('.login-box');
        loginBox.classList.add('shake');
        setTimeout(() => {
            loginBox.classList.remove('shake');
        }, 500);
    }

    // Clear error on input
    document.querySelectorAll('.login-container input, .login-container select').forEach(element => {
        element.addEventListener('input', () => {
            errorMsg.style.display = 'none';
        });
    });
});

import { signInUser } from './firebase-service.js';

class LoginPage {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('loginEmail');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.login();
        });

        // Auto-focus email field
        emailInput.focus();
    }

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');

        // Validation
        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            console.log('Attempting login with email:', email);
            
            // Sign in with Firebase
            const result = await signInUser(email, password);

            console.log('Login result:', result);

            if (result.success) {
                const user = result.user;
                
                // Store user in session
                sessionStorage.setItem('currentUser', JSON.stringify(user));

                console.log('User logged in:', user.name);
                
                this.showSuccess('Login successful!');
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                console.error('Login failed:', result.message);
                this.showError(result.message || 'Invalid email or password');
                this.setLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'An error occurred during login. Please try again.');
            this.setLoading(false);
        }
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    setLoading(loading) {
        const loginBtn = document.getElementById('loginBtn');
        if (loading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    }

    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.classList.remove('show');
    }

    showSuccess(message) {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.classList.add('show');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});

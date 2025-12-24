import { authenticateUser } from './firebase-service.js';

class LoginPage {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const userIdInput = document.getElementById('userId');
        const passwordInput = document.getElementById('password');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.login();
        });

        userIdInput.focus();

        userIdInput.addEventListener('input', (e) => {
            this.formatUserId(e.target);
        });
    }

    formatUserId(input) {
        let value = input.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
        
        // Auto-format as XXXX-XXXX-XXXX
        const parts = value.replace(/-/g, '').match(/.{1,4}/g);
        if (parts) {
            value = parts.join('-');
        }
        
        input.value = value;
    }

    async login() {
        const userId = document.getElementById('userId').value.trim().replace(/-/g, '');
        const password = document.getElementById('password').value;

        if (!userId || !password) {
            this.showError('Please enter both Entry ID and password');
            return;
        }

        if (userId.length !== 12) {
            this.showError('Invalid Entry ID format');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            const result = await authenticateUser(userId, password);

            if (result.success) {
                // Save user data to localStorage
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                
                // Redirect to dashboard
                window.location.href = 'index.html';
            } else {
                this.showError(result.message || 'Invalid Entry ID or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An error occurred during login. Please try again.');
        } finally {
            this.setLoading(false);
        }
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
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});

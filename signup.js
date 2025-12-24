import { createUser } from './firebase-service.js';

class SignupPage {
    constructor() {
        this.selectedPlan = 'Free';
        this.setupEventListeners();
    }

    setupEventListeners() {
        const signupForm = document.getElementById('signupForm');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.signup();
        });

        passwordInput.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });

        document.querySelectorAll('.plan-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectPlan(option);
            });
        });

        confirmPasswordInput.addEventListener('input', () => {
            this.validatePasswords();
        });

        document.getElementById('firstName').focus();
    }

    selectPlan(selectedOption) {
        document.querySelectorAll('.plan-option').forEach(option => {
            option.classList.remove('selected');
        });
        selectedOption.classList.add('selected');
        this.selectedPlan = selectedOption.dataset.plan;
    }

    updatePasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrengthBar');
        
        if (password.length === 0) {
            strengthBar.className = 'password-strength-bar';
            return;
        }

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) {
            strengthBar.className = 'password-strength-bar weak';
        } else if (strength <= 4) {
            strengthBar.className = 'password-strength-bar medium';
        } else {
            strengthBar.className = 'password-strength-bar strong';
        }
    }

    validatePasswords() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            document.getElementById('confirmPassword').style.borderColor = '#ef4444';
            return false;
        } else {
            document.getElementById('confirmPassword').style.borderColor = '';
            return true;
        }
    }

    async signup() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            this.showError('Password must be at least 8 characters long');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.setLoading(true);
        this.hideMessages();

        try {
            const result = await createUser({
                name: `${firstName} ${lastName}`,
                email: email,
                password: password,
                plan: this.selectedPlan + ' Plan'
            });

            if (result.success) {
                this.showSuccessMessage('Account created successfully!');
                this.displayUserId(result.entryId);
                document.getElementById('signupForm').reset();
                document.getElementById('passwordStrengthBar').className = 'password-strength-bar';
                
                // Save to localStorage for auto-login
                localStorage.setItem('pendingLogin', JSON.stringify({
                    entryId: result.entryId,
                    userId: result.userId
                }));
                
                // Redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                this.showError(result.message || 'Failed to create account');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('An error occurred during signup. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    displayUserId(entryId) {
        const userIdDisplay = document.getElementById('userIdDisplay');
        const userIdValue = document.getElementById('userIdValue');
        
        // Format as XXXX-XXXX-XXXX
        const formatted = entryId.match(/.{1,4}/g).join('-');
        userIdValue.textContent = formatted;
        userIdDisplay.classList.add('show');
    }

    setLoading(loading) {
        const signupBtn = document.getElementById('signupBtn');
        if (loading) {
            signupBtn.classList.add('loading');
            signupBtn.disabled = true;
        } else {
            signupBtn.classList.remove('loading');
            signupBtn.disabled = false;
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        successMessage.classList.remove('show');
    }

    showSuccessMessage(message) {
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        
        successMessage.textContent = message;
        successMessage.classList.add('show');
        errorMessage.classList.remove('show');
    }

    hideMessages() {
        document.getElementById('errorMessage').classList.remove('show');
        document.getElementById('successMessage').classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SignupPage();
});

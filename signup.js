// Import Firebase service
import { createUser, generateUserId } from './firebase-service.js';

class FirebaseService {
    constructor() {
        this.isInitialized = true;
        this.currentUser = null;
    }

    async signIn(userId) {
        try {
            const { getUserById } = await import('./firebase-service.js');
            const result = await getUserById(userId);
            if (result.success) {
                this.currentUser = result.user;
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                return { success: true, user: this.currentUser };
            }
            return { success: false, message: result.message || 'User not found' };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, message: 'Authentication failed' };
        }
    }

    async signOut() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        return { success: true };
    }

    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }
        
        const stored = sessionStorage.getItem('currentUser');
        if (stored) {
            try {
                const userData = JSON.parse(stored);
                this.currentUser = userData;
                return this.currentUser;
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                sessionStorage.removeItem('currentUser');
                return null;
            }
        }
        
        return null;
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const { updateUser } = await import('./firebase-service.js');
            const result = await updateUser(userId, {
                password: 'hashed_' + newPassword,
                passwordLastChanged: new Date()
            });

            if (result.success) {
                if (this.currentUser && this.currentUser.id === userId) {
                    this.currentUser.passwordLastChanged = new Date();
                    sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                }
            }

            return result;
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, message: 'Failed to change password' };
        }
    }

    async generateUserId() {
        try {
            const { generateUserId: genId } = await import('./firebase-service.js');
            return await genId();
        } catch (error) {
            console.error('Error generating user ID:', error);
            return this.generateLocalUserId();
        }
    }

    generateLocalUserId() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 24; i++) {
            if (i > 0 && i % 4 === 0) result += '-';
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

class SignupPage {
    constructor() {
        this.firebase = new FirebaseService();
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

        // Password strength indicator
        passwordInput.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });

        // Plan selection
        document.querySelectorAll('.plan-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectPlan(option);
            });
        });

        // Confirm password validation
        confirmPasswordInput.addEventListener('input', (e) => {
            this.validatePasswords();
        });

        // Auto-focus first name field
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
        
        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Character variety checks
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        // Update UI
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

        // Validation
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
            // Generate unique User ID
            const userId = await this.firebase.generateUserId();
            
            // Create user account in Firebase
            const userData = {
                id: userId,
                name: `${firstName} ${lastName}`,
                email: email,
                plan: this.selectedPlan + ' Plan',
                memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                tasksCompleted: 0,
                hoursSaved: 0,
                successRate: 0,
                password: 'hashed_' + password, // In real app, this would be properly hashed
                passwordLastChanged: new Date(),
                isActive: true
            };

            // Call Firebase createUser function
            const result = await createUser(userData);

            if (result.success) {
                // Store current user in session
                sessionStorage.setItem('currentUser', JSON.stringify(userData));

                // Show success message with User ID
                this.showSuccessMessage(`Account created successfully! Your User ID is: ${userId}`);
                this.displayUserId(userId);
                
                // Reset form
                document.getElementById('signupForm').reset();
                document.getElementById('passwordStrengthBar').className = 'password-strength-bar';

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                this.showError(result.message || 'Failed to create account. Please try again.');
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

    displayUserId(userId) {
        const userIdDisplay = document.getElementById('userIdDisplay');
        const userIdValue = document.getElementById('userIdValue');
        
        userIdValue.textContent = userId;
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupPage();
});

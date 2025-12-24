// Import Firebase service
import { getUserById, updateUser } from './firebase-service.js';

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check authentication
        this.currentUser = await this.getCurrentUser();
        
        if (!this.currentUser) {
            console.log('No user found, redirecting to signup');
            // Redirect to signup if not authenticated
            window.location.href = 'signup.html';
            return;
        }

        console.log('User authenticated:', this.currentUser.name);
        this.setupEventListeners();
        this.updateUI();
    }

    async getCurrentUser() {
        // Check session storage first
        const stored = sessionStorage.getItem('currentUser');
        if (stored) {
            try {
                const userData = JSON.parse(stored);
                // Verify user still exists in database
                const result = await getUserById(userData.id);
                if (result.success) {
                    return result.user;
                } else {
                    // User no longer exists, clear session
                    sessionStorage.removeItem('currentUser');
                    return null;
                }
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                sessionStorage.removeItem('currentUser');
                return null;
            }
        }
        
        return null;
    }

    setupEventListeners() {
        // Copy User ID
        document.getElementById('copyUserId').addEventListener('click', () => {
            this.copyToClipboard('userId');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Password modal
        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            this.showPasswordModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hidePasswordModal();
        });

        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        // Close modal on outside click
        document.getElementById('passwordModal').addEventListener('click', (e) => {
            if (e.target.id === 'passwordModal') {
                this.hidePasswordModal();
            }
        });
    }

    updateUI() {
        if (!this.currentUser) return;

        // Update profile information
        const [firstName, ...rest] = this.currentUser.name.split(' ');
        const initials = (firstName[0] + (rest[0]?.[0] || '')).toUpperCase();
        
        document.getElementById('profileInitials').textContent = initials;
        document.getElementById('profileName').textContent = this.currentUser.name;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        document.getElementById('userId').textContent = this.currentUser.id;
        document.getElementById('planBadge').textContent = this.currentUser.plan;
        document.getElementById('billingInfo').textContent = this.currentUser.plan.includes('Pro') ? 'Billed annually' : 'Billed monthly';
        document.getElementById('statusBadge').textContent = this.currentUser.isActive ? 'Active' : 'Inactive';
        document.getElementById('profileSince').textContent = `Member since ${this.currentUser.memberSince}`;

        // Update stats
        document.getElementById('tasksCompleted').textContent = this.currentUser.tasksCompleted;
        document.getElementById('hoursSaved').textContent = this.currentUser.hoursSaved;
        document.getElementById('successRate').textContent = this.currentUser.successRate + '%';

        // Update password info
        const lastChanged = new Date(this.currentUser.passwordLastChanged);
        const monthsAgo = Math.floor((new Date() - lastChanged) / (1000 * 60 * 60 * 24 * 30));
        document.getElementById('passwordInfo').textContent = 
            `Last changed ${monthsAgo} month${monthsAgo !== 1 ? 's' : ''} ago`;
    }

    copyToClipboard(elementId) {
        const text = document.getElementById(elementId).textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('User ID copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('User ID copied to clipboard!', 'success');
        });
    }

    showPasswordModal() {
        document.getElementById('passwordModal').classList.add('show');
        document.getElementById('passwordForm').reset();
    }

    hidePasswordModal() {
        document.getElementById('passwordModal').classList.remove('show');
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        try {
            const result = await updateUser(this.currentUser.id, {
                password: 'hashed_' + newPassword,
                passwordLastChanged: new Date()
            });

            if (result.success) {
                // Update cached user data
                this.currentUser.passwordLastChanged = new Date();
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                this.showToast('Password changed successfully!', 'success');
                this.hidePasswordModal();
                this.updateUI(); // Update the "last changed" text
            } else {
                this.showToast(result.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showToast('An error occurred while changing password', 'error');
        }
    }

    async logout() {
        try {
            sessionStorage.removeItem('currentUser');
            this.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'signup.html';
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Failed to logout', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});

// Export for use in other files
window.Dashboard = Dashboard;

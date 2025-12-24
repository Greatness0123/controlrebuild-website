import { getUserById, updateUser, changePassword } from './firebase-service.js';

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check authentication
        const stored = localStorage.getItem('currentUser');
        if (!stored) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const userData = JSON.parse(stored);
            
            // Verify user still exists in Firebase
            const result = await getUserById(userData.id);
            if (result.success) {
                this.currentUser = result.user;
                this.setupEventListeners();
                this.updateUI();
            } else {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Init error:', error);
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    }

    setupEventListeners() {
        document.getElementById('copyUserId').addEventListener('click', () => {
            this.copyToClipboard();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

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

        document.getElementById('passwordModal').addEventListener('click', (e) => {
            if (e.target.id === 'passwordModal') {
                this.hidePasswordModal();
            }
        });
    }

    updateUI() {
        if (!this.currentUser) return;

        // Profile initials
        const initials = this.currentUser.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
        document.getElementById('profileInitials').textContent = initials;
        
        // Profile info
        document.getElementById('profileName').textContent = this.currentUser.name;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        
        // Entry ID (formatted)
        const formatted = this.currentUser.entryId.match(/.{1,4}/g).join('-');
        document.getElementById('userId').textContent = formatted;

        // Stats
        document.querySelector('.stat:nth-child(1) .stat-value').textContent = 
            this.currentUser.tasksCompleted || 0;
        document.querySelector('.stat:nth-child(2) .stat-value').textContent = 
            (this.currentUser.hoursSaved || 0).toFixed(1);
        document.querySelector('.stat:nth-child(3) .stat-value').textContent = 
            (this.currentUser.successRate || 0) + '%';

        // Plan
        document.getElementById('userPlan').textContent = this.currentUser.plan || 'Free Plan';

        // Password info
        if (this.currentUser.passwordLastChanged) {
            const lastChanged = new Date(this.currentUser.passwordLastChanged);
            const monthsAgo = Math.floor((new Date() - lastChanged) / (1000 * 60 * 60 * 24 * 30));
            document.getElementById('passwordInfo').textContent = 
                `Last changed ${monthsAgo} month${monthsAgo !== 1 ? 's' : ''} ago`;
        }
    }

    copyToClipboard() {
        const text = document.getElementById('userId').textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Entry ID copied to clipboard!', 'success');
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Entry ID copied to clipboard!', 'success');
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

        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        try {
            const result = await changePassword(
                this.currentUser.id,
                currentPassword,
                newPassword
            );

            if (result.success) {
                this.showToast('Password changed successfully!', 'success');
                this.hidePasswordModal();
                
                // Refresh user data
                const userResult = await getUserById(this.currentUser.id);
                if (userResult.success) {
                    this.currentUser = userResult.user;
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    this.updateUI();
                }
            } else {
                this.showToast(result.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showToast('An error occurred while changing password', 'error');
        }
    }

    async logout() {
        localStorage.removeItem('currentUser');
        this.showToast('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
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

document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});

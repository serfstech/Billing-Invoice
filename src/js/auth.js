import bcrypt from 'bcryptjs';

export default class Auth {
    constructor(app) {
        this.app = app;
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.app.showToast('Error', 'Please enter username and password', 'error');
            return;
        }

        try {
            this.app.showLoading();

            // Check admin credentials
            const admin = await this.app.queryDatabase(
                'SELECT * FROM admin WHERE username = ?',
                [username]
            );

            if (admin.length === 0) {
                this.app.showToast('Error', 'Invalid username or password', 'error');
                return;
            }

            // Verify password using bcrypt
            const isValid = await bcrypt.compare(password, admin[0].password_hash);
            
            if (!isValid) {
                this.app.showToast('Error', 'Invalid username or password', 'error');
                return;
            }

            // Create session token
            const token = this.generateToken(admin[0]);
            
            // Store token in localStorage
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify({
                id: admin[0].id,
                username: admin[0].username,
                full_name: admin[0].full_name,
                email: admin[0].email
            }));

            this.app.currentUser = {
                id: admin[0].id,
                username: admin[0].username,
                full_name: admin[0].full_name,
                email: admin[0].email
            };

            this.app.showToast('Success', 'Login successful!', 'success');
            this.app.showApp();
            this.app.navigateTo('dashboard');

        } catch (error) {
            console.error('Login error:', error);
            this.app.showToast('Error', 'Login failed. Please try again.', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async logout() {
        try {
            // Clear all stored data
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            sessionStorage.clear();

            // Reset app state
            this.app.currentUser = null;
            this.app.currentPage = 'dashboard';

            // Show login screen
            this.app.showLogin();

            this.app.showToast('Success', 'Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async verifyToken(token) {
        try {
            // In a real app, you would verify JWT token
            // For this offline app, we'll check if token exists in localStorage
            const userData = localStorage.getItem('user_data');
            
            if (!userData) {
                return null;
            }

            const user = JSON.parse(userData);
            
            // Verify user still exists in database
            const admin = await this.app.queryDatabase(
                'SELECT id FROM admin WHERE id = ? AND username = ?',
                [user.id, user.username]
            );

            return admin.length > 0 ? user : null;
        } catch (error) {
            console.error('Token verification error:', error);
            return null;
        }
    }

    generateToken(user) {
        // Simple token generation for offline app
        // In production, use JWT or similar
        const data = {
            id: user.id,
            username: user.username,
            timestamp: Date.now()
        };
        
        return btoa(JSON.stringify(data));
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const admin = await this.app.queryDatabase(
                'SELECT password_hash FROM admin WHERE id = ?',
                [this.app.currentUser.id]
            );

            if (admin.length === 0) {
                return { success: false, message: 'User not found' };
            }

            const isValid = await bcrypt.compare(oldPassword, admin[0].password_hash);
            
            if (!isValid) {
                return { success: false, message: 'Current password is incorrect' };
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(newPassword, salt);

            // Update password in database
            await this.app.executeDatabase(
                'UPDATE admin SET password_hash = ? WHERE id = ?',
                [newHash, this.app.currentUser.id]
            );

            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, message: 'Failed to change password' };
        }
    }

    async createAdmin(username, password, email, fullName) {
        try {
            // Check if admin already exists
            const existingAdmin = await this.app.queryDatabase(
                'SELECT id FROM admin WHERE username = ?',
                [username]
            );

            if (existingAdmin.length > 0) {
                return { success: false, message: 'Username already exists' };
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            // Create admin
            await this.app.executeDatabase(
                'INSERT INTO admin (username, password_hash, email, full_name) VALUES (?, ?, ?, ?)',
                [username, hash, email, fullName]
            );

            return { success: true, message: 'Admin created successfully' };
        } catch (error) {
            console.error('Create admin error:', error);
            return { success: false, message: 'Failed to create admin' };
        }
    }

    async updateProfile(data) {
        try {
            await this.app.executeDatabase(
                'UPDATE admin SET full_name = ?, email = ? WHERE id = ?',
                [data.full_name, data.email, this.app.currentUser.id]
            );

            // Update current user data
            this.app.currentUser.full_name = data.full_name;
            this.app.currentUser.email = data.email;
            
            // Update localStorage
            localStorage.setItem('user_data', JSON.stringify(this.app.currentUser));

            return { success: true, message: 'Profile updated successfully' };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, message: 'Failed to update profile' };
        }
    }

    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    }

    getCurrentUser() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }

    async checkPasswordStrength(password) {
        const checks = {
            length: password.length >= 8,
            hasLower: /[a-z]/.test(password),
            hasUpper: /[A-Z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const score = Object.values(checks).filter(Boolean).length;
        
        return {
            score,
            isStrong: score >= 4,
            feedback: this.getPasswordFeedback(checks)
        };
    }

    getPasswordFeedback(checks) {
        const feedback = [];
        
        if (!checks.length) feedback.push('Password should be at least 8 characters');
        if (!checks.hasLower) feedback.push('Include lowercase letters');
        if (!checks.hasUpper) feedback.push('Include uppercase letters');
        if (!checks.hasNumber) feedback.push('Include numbers');
        if (!checks.hasSpecial) feedback.push('Include special characters');
        
        return feedback;
    }
}
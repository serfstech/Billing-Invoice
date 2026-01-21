// MAIN APPLICATION - WORKING VERSION
// Remove all imports at the top - we'll create them dynamically

import { loadDashboard } from "./dashboard.js";
import { loadCustomers } from "./customers.js";
import { loadProducts } from "./products.js";

import { loadSuppliers } from "./suppliers.js";


// sidebar events
document.getElementById("dashboard").addEventListener("click", loadDashboard);
document.getElementById("suppliers").addEventListener("click", loadSuppliers);

document.addEventListener('DOMContentLoaded', () => {
    console.log('Renderer loaded');

    // 🔥 FORCE HIDE LOADING OVERLAY
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.style.display = 'none';
        console.log('Loading overlay hidden');
    }
});

class Application {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentUser = null;
        this.notificationCount = 0;
        this.modules = {};
        this.init();
    }

    async init() {
        await this.loadModules();
        this.setupEventListeners();
        this.checkAuth();
        this.loadTheme();
        
        // Check for low stock notifications
        setInterval(() => this.checkLowStock(), 300000); // Every 5 minutes
    }

    async loadModules() {
        // Define module classes inline since imports don't work in browser
        class Auth {
            constructor(app) {
                this.app = app;
            }

            async login() {
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                console.log('Login attempt:', username, password);
                
                // Simple hardcoded login for testing
                if (username === 'admin' && password === 'admin123') {
                    // Try database authentication
                    try {
                        if (window.electronAPI) {
                            const result = await window.electronAPI.queryDatabase(
                                'SELECT * FROM admin WHERE username = ?',
                                [username]
                            );
                            
                            if (result.length > 0) {
                                // In real app, verify password hash
                                localStorage.setItem('auth_token', 'temp_token');
                                localStorage.setItem('user', JSON.stringify({
                                    id: result[0].id,
                                    username: result[0].username,
                                    full_name: result[0].full_name || 'Admin',
                                    role: 'admin'
                                }));
                                
                                this.app.currentUser = {
                                    id: result[0].id,
                                    username: result[0].username,
                                    full_name: result[0].full_name || 'Admin',
                                    role: 'admin'
                                };
                                
                                this.app.showApp();
                                this.app.navigateTo('dashboard');
                                this.app.showToast('Login Successful', 'Welcome back!', 'success');
                                return;
                            }
                        }
                    } catch (error) {
                        console.log('Database auth failed, using fallback:', error);
                    }
                    
                    // Fallback to hardcoded login
                    localStorage.setItem('auth_token', 'temp_token');
                    localStorage.setItem('user', JSON.stringify({
                        id: 1,
                        username: 'admin',
                        full_name: 'System Administrator',
                        role: 'admin'
                    }));
                    
                    this.app.currentUser = {
                        id: 1,
                        username: 'admin',
                        full_name: 'System Administrator',
                        role: 'admin'
                    };
                    
                    this.app.showApp();
                    this.app.navigateTo('dashboard');
                    this.app.showToast('Login Successful', 'Welcome back!', 'success');
                } else {
                    this.app.showToast('Login Failed', 'Invalid credentials', 'error');
                }
            }

            async logout() {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                this.app.currentUser = null;
                this.app.showLogin();
                this.app.showToast('Logged Out', 'You have been logged out', 'info');
            }

            async verifyToken(token) {
                const user = localStorage.getItem('user');
                return user ? JSON.parse(user) : null;
            }
        }

        class Dashboard {
            constructor(app) {
                this.app = app;
            }

            async load() {
                return `
                    <div class="dashboard">
                        <div class="page-header">
                            <h1>Dashboard</h1>
                            <p>Welcome back, ${this.app.currentUser?.full_name || 'Admin'}!</p>
                        </div>
                        <div class="dashboard-grid">
                            <div class="card">
                                <div class="card-header">
                                    <i class="material-icons">dashboard</i>
                                    <h3>Quick Stats</h3>
                                </div>
                                <div class="card-body">
                                    <p>Application loaded successfully!</p>
                                    <div class="stats-grid">
                                        <div class="stat-item">
                                            <div class="stat-value">0</div>
                                            <div class="stat-label">Today's Sales</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-value">0</div>
                                            <div class="stat-label">Total Products</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-value">0</div>
                                            <div class="stat-label">Low Stock</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-value">0</div>
                                            <div class="stat-label">Pending Orders</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-primary" onclick="app.navigateTo('products')">
                                        <i class="material-icons">inventory_2</i> Manage Products
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            async init() {
                console.log('Dashboard initialized');
            }
        }

        // Define other modules as simple placeholders
        class SimpleModule {
            constructor(app, name) {
                this.app = app;
                this.name = name;
            }

            async load() {
                return `
                    <div class="page-content">
                        <div class="page-header">
                            <h1>${this.name.charAt(0).toUpperCase() + this.name.slice(1)}</h1>
                            <p>Module under development</p>
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <p>This module will be implemented soon. For now, you can use the dashboard.</p>
                                <button class="btn btn-primary" onclick="app.navigateTo('dashboard')">
                                    <i class="material-icons">arrow_back</i> Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            async init() {
                console.log(`${this.name} module initialized`);
            }
        }

        class Notifications {
            constructor(app) {
                this.app = app;
            }

            async loadNotifications() {
                try {
                    if (window.electronAPI) {
                        const notifications = await window.electronAPI.queryDatabase(
                            'SELECT * FROM notifications WHERE is_read = FALSE ORDER BY created_at DESC LIMIT 10'
                        );
                        this.displayNotifications(notifications);
                    }
                } catch (error) {
                    console.error('Error loading notifications:', error);
                }
            }

            displayNotifications(notifications) {
                const container = document.getElementById('notificationList');
                if (!container) return;
                
                if (notifications.length === 0) {
                    container.innerHTML = '<div class="no-notifications">No new notifications</div>';
                    return;
                }
                
                container.innerHTML = notifications.map(notif => `
                    <div class="notification-item ${notif.type}">
                        <i class="material-icons">${this.getNotificationIcon(notif.type)}</i>
                        <div class="notification-content">
                            <div class="notification-title">${notif.title}</div>
                            <div class="notification-message">${notif.message}</div>
                            <div class="notification-time">${this.app.formatDate(notif.created_at)}</div>
                        </div>
                    </div>
                `).join('');
                
                document.getElementById('notificationCount').textContent = notifications.length;
            }

            getNotificationIcon(type) {
                switch(type) {
                    case 'low_stock': return 'inventory';
                    case 'out_of_stock': return 'error';
                    case 'system': return 'settings';
                    default: return 'notifications';
                }
            }

            async createNotification(type, title, message, relatedId = null) {
                try {
                    if (window.electronAPI) {
                        await window.electronAPI.executeDatabase(
                            'INSERT INTO notifications (type, title, message, related_id) VALUES (?, ?, ?, ?)',
                            [type, title, message, relatedId]
                        );
                        await this.loadNotifications();
                    }
                } catch (error) {
                    console.error('Error creating notification:', error);
                }
            }

            updateNotificationCount() {
                // This would update the badge count
                // For now, we'll reload notifications
                this.loadNotifications();
            }
        }

        // Initialize all modules
        this.modules = {
            auth: new Auth(this),
            dashboard: new Dashboard(this),
            suppliers: new SimpleModule(this, 'suppliers'),
            customers: new SimpleModule(this, 'customers'),
            products: new SimpleModule(this, 'products'),
            purchases: new SimpleModule(this, 'purchases'),
            sales: new SimpleModule(this, 'sales'),
            invoices: new SimpleModule(this, 'invoices'),
            stock: new SimpleModule(this, 'stock'),
            reports: new SimpleModule(this, 'reports'),
            notifications: new Notifications(this)
        };
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.modules.auth.login();
            });
        }

        // Make inputs focusable
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput) {
            usernameInput.addEventListener('focus', () => {
                console.log('Username field focused');
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('focus', () => {
                console.log('Password field focused');
            });
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.toggle('active');
            });
        }

        // Navigation menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) this.navigateTo(page);
            });
        });

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }

        // Notification bell
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotifications();
            });
        }

        // User menu
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.modules.auth.logout();
            });
        }

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            const notificationPanel = document.getElementById('notificationPanel');
            const userMenuDropdown = document.getElementById('userMenuDropdown');
            
            if (notificationPanel && !e.target.closest('.notification-panel') && !e.target.closest('#notificationBell')) {
                notificationPanel.classList.remove('active');
            }
            
            if (userMenuDropdown && !e.target.closest('.user-menu-dropdown') && !e.target.closest('#userMenu')) {
                userMenuDropdown.classList.remove('active');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + N for new invoice
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                if (this.currentPage === 'sales') {
                    // this.modules.sales.createNewInvoice();
                }
            }
            
            // Ctrl + F for search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const searchBox = document.querySelector('.search-box');
                if (searchBox) searchBox.focus();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async checkAuth() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                // Verify token
                const user = await this.modules.auth.verifyToken(token);
                if (user) {
                    this.currentUser = user;
                    this.showApp();
                    this.navigateTo('dashboard');
                } else {
                    this.showLogin();
                }
            } catch (error) {
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
        
        // Focus on username field
        setTimeout(() => {
            const usernameInput = document.getElementById('username');
            if (usernameInput) usernameInput.focus();
        }, 100);
    }

    showApp() {
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        
        // Update username display
        const usernameDisplay = document.getElementById('usernameDisplay');
        const dropdownUsername = document.getElementById('dropdownUsername');
        
        if (usernameDisplay) usernameDisplay.textContent = this.currentUser?.full_name || 'Admin';
        if (dropdownUsername) dropdownUsername.textContent = this.currentUser?.full_name || 'Admin';
        
        // Load notifications
        this.modules.notifications.loadNotifications();
    }

    async navigateTo(page) {
        if (!this.modules[page]) {
            console.error('Module not found:', page);
            return;
        }

        // Update active menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        this.currentPage = page;
        
        // Show loading
        this.showLoading();
        
        try {
            // Load page content
            const content = await this.modules[page].load();
            const mainContent = document.getElementById('mainContent');
            if (mainContent) mainContent.innerHTML = content;
            
            // Initialize page
            await this.modules[page].init();
            
            // Update page title
            document.title = `${page.charAt(0).toUpperCase() + page.slice(1)} - Distributor System`;
        } catch (error) {
            console.error('Error loading page:', error);
            this.showToast('Error', 'Failed to load page', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    }

    async hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }

    showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            console.log('Toast container not found');
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="material-icons toast-icon">${this.getToastIcon(type)}</i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="btn btn-text toast-close">
                <i class="material-icons">close</i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (toast.parentNode) {
                    toast.remove();
                }
            });
        }
    }

    getToastIcon(type) {
        switch(type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    }

    showModal(title, content, buttons = []) {
        const modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) return null;
        
        modalContainer.innerHTML = '';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">
                        <i class="material-icons">close</i>
                    </button>
                </div>
                <div class="modal-body">${content}</div>
                ${buttons.length > 0 ? `
                    <div class="modal-footer">
                        ${buttons.map(btn => `
                            <button class="btn ${btn.class || 'btn-primary'}" ${btn.id ? `id="${btn.id}"` : ''}>
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        modalContainer.appendChild(modal);
        
        // Close modal on X click
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (modal.parentNode) {
                    modal.remove();
                }
            });
        }
        
        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal && modal.parentNode) {
                modal.remove();
            }
        });
        
        return modal;
    }

    closeAllModals() {
        const modalContainer = document.getElementById('modalContainer');
        const notificationPanel = document.getElementById('notificationPanel');
        const userMenuDropdown = document.getElementById('userMenuDropdown');
        
        if (modalContainer) modalContainer.innerHTML = '';
        if (notificationPanel) notificationPanel.classList.remove('active');
        if (userMenuDropdown) userMenuDropdown.classList.remove('active');
    }

    toggleNotifications() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('active');
            if (panel.classList.contains('active')) {
                this.modules.notifications.loadNotifications();
            }
        }
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('userMenuDropdown');
        if (dropdown) dropdown.classList.toggle('active');
    }

    toggleDarkMode() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = document.querySelector('#darkModeToggle i');
        if (icon) icon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = document.querySelector('#darkModeToggle i');
        if (icon) icon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    async checkLowStock() {
        try {
            if (window.electronAPI) {
                const lowStockProducts = await window.electronAPI.queryDatabase(`
                    SELECT p.id, p.name, p.current_stock, p.minimum_stock
                    FROM products p
                    WHERE p.current_stock <= p.minimum_stock
                    AND p.current_stock > 0
                `);
                
                const outOfStockProducts = await window.electronAPI.queryDatabase(`
                    SELECT p.id, p.name
                    FROM products p
                    WHERE p.current_stock <= 0
                `);
                
                // Create notifications
                for (const product of lowStockProducts) {
                    await this.modules.notifications.createNotification(
                        'low_stock',
                        'Low Stock Alert',
                        `Product "${product.name}" is low on stock. Current: ${product.current_stock}, Minimum: ${product.minimum_stock}`,
                        product.id
                    );
                }
                
                for (const product of outOfStockProducts) {
                    await this.modules.notifications.createNotification(
                        'out_of_stock',
                        'Out of Stock Alert',
                        `Product "${product.name}" is out of stock!`,
                        product.id
                    );
                }
                
                // Update notification count
                this.modules.notifications.updateNotificationCount();
            }
        } catch (error) {
            console.error('Error checking low stock:', error);
        }
    }

    // Utility methods for database operations
    async queryDatabase(query, params = []) {
        try {
            if (window.electronAPI) {
                return await window.electronAPI.queryDatabase(query, params);
            }
            return [];
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async executeDatabase(query, params = []) {
        try {
            if (window.electronAPI) {
                return await window.electronAPI.executeDatabase(query, params);
            }
            return { affectedRows: 0 };
        } catch (error) {
            console.error('Database execute error:', error);
            throw error;
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        const re = /^[6-9]\d{9}$/;
        return re.test(phone);
    }

    validateGST(gst) {
        const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return re.test(gst);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.app = new Application();
});

// Make app available globally
window.Application = Application;
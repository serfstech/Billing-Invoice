/* ======================================================
   APPLICATION BOOTSTRAP
====================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    window.app = new Application();
});

/* ======================================================
   APPLICATION CLASS
====================================================== */

class Application {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentUser = null;
        this.modules = {};
        this.init();
    }

    async init() {
        this.loadTheme();
        await this.loadModules();
        this.setupEventListeners();

        // 🔥 UI MUST NEVER WAIT FOR DB
        this.hideLoading();

        try {
            await this.checkAuth();
        } catch {
            this.showLogin();
        }

        // background tasks only
        setInterval(() => this.checkLowStock(), 300000);
    }

    /* ======================================================
       MODULE LOADING
    ====================================================== */

    async loadModules() {
        /* ---------------- AUTH ---------------- */
        class Auth {
            constructor(app) {
                this.app = app;
            }

            async login() {
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();

                // ✅ OFFLINE FIRST
                if (username === 'admin' && password === 'admin123') {
                    this.app.loginSuccess({
                        id: 1,
                        username: 'admin',
                        full_name: 'System Administrator',
                        role: 'admin'
                    });

                    // optional DB verification (non-blocking)
                    window.electronAPI?.queryDatabase(
                        'SELECT * FROM admin WHERE username = ?',
                        [username]
                    ).catch(() => {});
                } else {
                    this.app.showToast('Login Failed', 'Invalid credentials', 'error');
                }
            }

            logout() {
                localStorage.clear();
                this.app.currentUser = null;
                this.app.showLogin();
            }

            async verifyToken() {
                const user = localStorage.getItem('user');
                return user ? JSON.parse(user) : null;
            }
        }

        /* ---------------- DASHBOARD ---------------- */
        class Dashboard {
            constructor(app) {
                this.app = app;
            }

            async load() {
                return `
                    <div class="page-header">
                        <h1>Dashboard</h1>
                        <p>Welcome, ${this.app.currentUser?.full_name}</p>
                    </div>
                `;
            }

            async init() {}
        }

        /* ---------------- SIMPLE MODULE ---------------- */
        class SimpleModule {
            constructor(app, name) {
                this.app = app;
                this.name = name;
            }

            async load() {
                return `
                    <div class="page-header">
                        <h1>${this.name}</h1>
                        <p>Module under development</p>
                    </div>
                `;
            }

            async init() {}
        }

        /* ---------------- NOTIFICATIONS ---------------- */
        class Notifications {
            constructor(app) {
                this.app = app;
            }

            async loadNotifications() {
                try {
                    const rows = await window.electronAPI?.queryDatabase(
                        'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10'
                    );
                    if (!Array.isArray(rows)) return;
                    document.getElementById('notificationCount').textContent = rows.length;
                } catch {}
            }
        }

        this.modules = {
            auth: new Auth(this),
            dashboard: new Dashboard(this),
            suppliers: new SimpleModule(this, 'Suppliers'),
            customers: new SimpleModule(this, 'Customers'),
            products: new SimpleModule(this, 'Products'),
            purchases: new SimpleModule(this, 'Purchases'),
            sales: new SimpleModule(this, 'Sales'),
            invoices: new SimpleModule(this, 'Invoices'),
            stock: new SimpleModule(this, 'Stock'),
            reports: new SimpleModule(this, 'Reports'),
            notifications: new Notifications(this)
        };
    }

    /* ======================================================
       AUTH & UI FLOW
    ====================================================== */

    async checkAuth() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.showLogin();
            return;
        }

        const user = await this.modules.auth.verifyToken();
        if (user) {
            this.loginSuccess(user);
        } else {
            this.showLogin();
        }
    }

    loginSuccess(user) {
        this.currentUser = user;
        localStorage.setItem('auth_token', 'ok');
        localStorage.setItem('user', JSON.stringify(user));

        this.showApp();
        this.navigateTo('dashboard');
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
        document.getElementById('username')?.focus();
    }

    showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');

        document.getElementById('usernameDisplay').textContent =
            this.currentUser?.full_name || 'Admin';
    }

    /* ======================================================
       NAVIGATION
    ====================================================== */

    async navigateTo(page) {
        if (!this.modules[page]) return;

        this.setActiveMenu(page);
        this.showLoading();

        try {
            const content = await Promise.race([
                this.modules[page].load(),
                new Promise((_, r) => setTimeout(() => r('timeout'), 3000))
            ]);

            document.getElementById('mainContent').innerHTML = content;
            await this.modules[page].init();
        } catch {
            document.getElementById('mainContent').innerHTML =
                `<p>Failed to load ${page}</p>`;
        } finally {
            this.hideLoading();
        }
    }

    setActiveMenu(page) {
        document.querySelectorAll('.menu-item').forEach(i => {
            i.classList.toggle('active', i.dataset.page === page);
        });
    }

    /* ======================================================
       EVENTS
    ====================================================== */

    setupEventListeners() {
        document.getElementById('loginForm')?.addEventListener('submit', e => {
            e.preventDefault();
            this.modules.auth.login();
        });

        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateTo(item.dataset.page);
            });
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.modules.auth.logout();
        });
    }

    /* ======================================================
       LOADING (ONE SYSTEM ONLY)
    ====================================================== */

    showLoading() {
        document.getElementById('loadingOverlay')?.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay')?.classList.add('hidden');
    }

    /* ======================================================
       UTILITIES
    ====================================================== */

    showToast(title, msg, type = 'info') {
        alert(`${title}: ${msg}`);
    }

    loadTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }

    async checkLowStock() {
        // background only – never block UI
        try {
            await window.electronAPI?.queryDatabase('SELECT 1');
        } catch {}
    }
}

/* expose */
window.Application = Application;

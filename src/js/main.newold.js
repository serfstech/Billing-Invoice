/* ================================
   GLOBAL HELPERS
================================ */

function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = 'none';
}

function showLogin() {
    const login = document.getElementById('loginScreen');
    if (login) login.style.display = 'flex';
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').classList.remove('hidden');
}

function showToast(message, type = 'error') {
    alert(message); // simple for now
}

/* ================================
   APPLICATION
================================ */

class Application {
    constructor() {
        this.bindLogin();
        this.init();
    }

    async init() {
        console.log('Initializing app (non-blocking)...');

        // 🔥 DO NOT BLOCK UI FOR DB
        hideLoading();
        showLogin();

        // Optional background DB check
        if (window.electronAPI?.queryDatabase) {
            window.electronAPI
                .queryDatabase('SELECT 1')
                .then(() => console.log('DB connected'))
                .catch(err => console.warn('DB offline:', err));
        }
    }

    bindLogin() {
        const form = document.getElementById('loginForm');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            // 🔥 TEMP OFFLINE LOGIN
            if (username === 'admin' && password === 'admin123') {
                this.loginSuccess(username);
            } else {
                showToast('Invalid username or password');
            }
        });
    }

    loginSuccess(username) {
        console.log('Login success:', username);

        document.getElementById('usernameDisplay').textContent = username;
        document.getElementById('dropdownUsername').textContent = username;

        showApp();
        this.loadDashboard();
    }

    loadDashboard() {
        const main = document.getElementById('mainContent');
        main.innerHTML = `
            <h1>Welcome</h1>
            <p>Dashboard loaded successfully.</p>
        `;
    }
}

/* ================================
   START APP
================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Renderer loaded');
    window.app = new Application();
});

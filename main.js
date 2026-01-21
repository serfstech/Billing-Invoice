const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const db = require('./database/config');

let mainWindow;
let tray = null;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/logo.png'),
        show: false
    });

    await mainWindow.loadFile(
        path.join(__dirname, 'src', 'index.html')
    );

    mainWindow.webContents.openDevTools();

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        autoUpdater.checkForUpdatesAndNotify();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    createMenu();
}

function createMenu() {
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Backup Database',
                    click: async () => {
                        const file = await db.backup();
                        mainWindow.webContents.send('backup-done', file);
                    }
                },
                { role: 'quit' }
            ]
        },
        { role: 'editMenu' },
        { role: 'viewMenu' },
        { role: 'windowMenu' }
    ]);

    Menu.setApplicationMenu(menu);
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'assets/icon.png'));
    tray.setToolTip('Distributor Invoice System');
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Show', click: () => mainWindow.show() },
        { label: 'Quit', click: () => app.quit() }
    ]));
}

app.whenReady().then(async () => {
    try {
        await db.init(); // 🔥 IMPORTANT
        console.log('DB ready');
    } catch (e) {
        console.error('DB failed but app will continue');
    }

    await createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC
ipcMain.handle('database-query', async (e, query, params) => {
    try {
        return await db.query(query, params);
    } catch (err) {
        return { error: err.message };
    }
});

ipcMain.handle('database-execute', async (e, query, params) => {
    try {
        return await db.execute(query, params);
    } catch (err) {
        return { error: err.message };
    }
});

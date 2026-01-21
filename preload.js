const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations
    queryDatabase: (query, params) => ipcRenderer.invoke('database-query', query, params),
    executeDatabase: (query, params) => ipcRenderer.invoke('database-execute', query, params),
    
    // File operations
    savePDF: (data, filename) => ipcRenderer.invoke('save-pdf', data, filename),
    backupDatabase: () => ipcRenderer.invoke('backup-database'),
    
    // App operations
    minimizeApp: () => ipcRenderer.send('minimize-app'),
    maximizeApp: () => ipcRenderer.send('maximize-app'),
    closeApp: () => ipcRenderer.send('close-app'),
    
    // Notifications
    showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),
    
    // Events
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback)
});
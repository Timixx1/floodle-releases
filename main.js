const { app, BrowserWindow, Menu, shell, Tray, nativeImage, globalShortcut, session, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let win;
let tray;

// Отключаем очистку сессии при старте
app.commandLine.appendSwitch('disable-features', 'CookiesWithoutSameSiteMustBeSecure');

function createWindow() {
    // Используем постоянное хранилище для сессии
    const ses = session.fromPartition('persist:floodle');
    
    win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 600,
        icon: path.join(__dirname, 'logo4.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            session: ses
        },
        show: false
    });

    // Загружаем сайт
    win.loadURL('https://floodle.site');

    win.once('ready-to-show', () => {
        win.show();
    });

    // Открываем внешние ссылки в браузере
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Кастомное меню
    const template = [
        {
            label: 'Floodle',
            submenu: [
                { label: 'Dashboard', click: () => win.loadURL('https://floodle.site/dashboard.php') },
                { label: 'Notes', click: () => win.loadURL('https://floodle.site/notes.php') },
                { label: 'Chat', click: () => win.loadURL('https://floodle.site/chat.php') },
                { label: 'Paste', click: () => win.loadURL('https://floodle.site/paste.php') },
                { label: 'AI', click: () => win.loadURL('https://floodle.site/ai.php') },
                { type: 'separator' },
                {
                    label: 'Shortcuts ⌨️',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        const { BrowserWindow } = require('electron');
                        let shortcutsWin = new BrowserWindow({
                            width: 700,
                            height: 550,
                            parent: win,
                            modal: true,
                            resizable: false,
                            icon: path.join(__dirname, 'logo4.png'),
                            webPreferences: {
                                nodeIntegration: false,
                                contextIsolation: true
                            }
                        });
                        shortcutsWin.loadFile('hotkeys.html');
                        shortcutsWin.setMenuBarVisibility(false);
                    }
                },
                { type: 'separator' },
                { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => win.reload() },
                { label: 'DevTools', accelerator: 'F12', click: () => win.webContents.openDevTools() },
                { type: 'separator' },
                { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'copy' },
                { role: 'paste' },
                { type: 'separator' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray() {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'logo4.png'));
    tray = new Tray(icon.resize({ width: 18, height: 18 }));
    
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Floodle', click: () => win.show() },
        { label: 'New Note', click: () => {
            win.show();
            win.webContents.executeJavaScript(`window.location.href = 'https://floodle.site/edit_note.php';`);
        }},
        { label: 'New Chat', click: () => {
            win.show();
            win.webContents.executeJavaScript(`window.location.href = 'https://floodle.site/chat.php';`);
        }},
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ]);
    
    tray.setToolTip('Floodle');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        win.isVisible() ? win.hide() : win.show();
    });
}

function registerShortcuts() {
    globalShortcut.register('CommandOrControl+Shift+N', () => {
        win.show();
        win.webContents.executeJavaScript(`window.location.href = 'https://floodle.site/edit_note.php';`);
    });
    
    globalShortcut.register('CommandOrControl+Shift+C', () => {
        win.show();
        win.webContents.executeJavaScript(`window.location.href = 'https://floodle.site/chat.php';`);
    });
    
    globalShortcut.register('CommandOrControl+Shift+H', () => {
        win.isVisible() ? win.hide() : win.show();
    });
}

function setupAutoUpdater() {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('checking-for-update', () => {
        console.log('[Floodle] Checking for update...');
    });
    
    autoUpdater.on('update-available', (info) => {
        console.log('[Floodle] Update available:', info);
    });
    
    autoUpdater.on('update-not-available', (info) => {
        console.log('[Floodle] No update available:', info);
    });
    
    autoUpdater.on('error', (err) => {
        console.error('[Floodle] Update error:', err);
    });
    
    autoUpdater.on('update-downloaded', (info) => {
        console.log('[Floodle] Update downloaded. Asking user to restart...');
        dialog.showMessageBox({
            type: 'info',
            title: 'Floodle Update',
            message: 'New version downloaded!',
            detail: 'Restart to apply the update.',
            buttons: ['Restart now', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    registerShortcuts();
    setupAutoUpdater();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
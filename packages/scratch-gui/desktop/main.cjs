/* global __dirname, console, process */

const {app, BrowserWindow, dialog, session, shell} = require('electron');
const path = require('path');
const {APP_NAME, WINDOW_TITLE, createCloseHandler} = require('./window-config.cjs');

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 960,
        minHeight: 640,
        show: false,
        title: WINDOW_TITLE,
        icon: path.join(__dirname, 'icon.png'),
        backgroundColor: '#855cd6',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.webContents.on('page-title-updated', event => {
        event.preventDefault();
        mainWindow.setTitle(WINDOW_TITLE);
    });
    mainWindow.on('close', createCloseHandler({app, dialog, logger: console, mainWindow}));
    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            shell.openExternal(url);
        }
        return {action: 'deny'};
    });
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith('file://')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
};

app.setName(APP_NAME);
app.setAppUserModelId('ir.behenamapp.scratch.fa');
app.whenReady().then(() => {
    session.defaultSession.on('will-download', (_event, item) => {
        item.setSaveDialogOptions({
            title: 'ذخیره فایل',
            defaultPath: item.getFilename()
        });
    });
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('desktopPackager', Object.freeze({
    request: message => ipcRenderer.invoke('packager-export', message)
}));

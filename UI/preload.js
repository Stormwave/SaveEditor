const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', 
{
    uploadFile: (paths, ext) => 
    {
        ipcRenderer.send('upload', paths, ext)
    }
})
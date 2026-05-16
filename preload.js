const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('hexClip', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  copyItem: (id) => ipcRenderer.invoke('copy-item', id),
  pinItem: (id) => ipcRenderer.invoke('pin-item', id),
  deleteItem: (id) => ipcRenderer.invoke('delete-item', id),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  hidePicker: () => ipcRenderer.invoke('hide-picker'),
  onRefresh: (cb) => ipcRenderer.on('refresh-history', (_, data) => cb(data))
})

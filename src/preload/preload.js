const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hexClip", {
  // History
  getHistory:   ()   => ipcRenderer.invoke("get-history"),
  copyItem:     (id) => ipcRenderer.invoke("copy-item", id),
  pinItem:      (id) => ipcRenderer.invoke("pin-item", id),
  deleteItem:   (id) => ipcRenderer.invoke("delete-item", id),
  clearHistory: ()   => ipcRenderer.invoke("clear-history"),

  // Private mode
  getPrivateMode: ()        => ipcRenderer.invoke("get-private-mode"),
  setPrivateMode: (enabled) => ipcRenderer.invoke("set-private-mode", enabled),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke("win-minimize"),
  windowMaximize: () => ipcRenderer.invoke("win-maximize"),
  windowHide:     () => ipcRenderer.invoke("win-hide"),
  windowQuit:     () => ipcRenderer.invoke("win-quit"),

  // System
  notify:       (title, body) => ipcRenderer.invoke("notify", title, body),
  getLoginItem: ()            => ipcRenderer.invoke("get-login-item"),
  setLoginItem: (enabled)     => ipcRenderer.invoke("set-login-item", enabled),
  getVersion:   ()            => ipcRenderer.invoke("get-version"),

  // Main -> renderer events
  onRefresh:     (cb) => ipcRenderer.on("refresh-history", (_, data) => cb(data)),
  onPrivateMode: (cb) => ipcRenderer.on("private-mode", (_, enabled) => cb(enabled)),
  onSwitchTab:   (cb) => ipcRenderer.on("switch-tab", (_, tab) => cb(tab)),
});

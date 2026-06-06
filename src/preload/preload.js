const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hexClip", {
  // History
  getHistory:   ()   => ipcRenderer.invoke("get-history"),
  copyItem:     (id)   => ipcRenderer.invoke("copy-item", id),
  copyText:     (text) => ipcRenderer.invoke("copy-text", text),
  pinItem:      (id)        => ipcRenderer.invoke("pin-item", id),
  setTitle:     (id, title) => ipcRenderer.invoke("set-title", id, title),
  setPos:       (id, x, y)  => ipcRenderer.invoke("set-pos", id, x, y),
  deleteItem:   (id) => ipcRenderer.invoke("delete-item", id),
  clearHistory: ()   => ipcRenderer.invoke("clear-history"),

  // Notes
  getNotes:   ()         => ipcRenderer.invoke("get-notes"),
  createNote: (data)     => ipcRenderer.invoke("create-note", data),
  updateNote: (id, data) => ipcRenderer.invoke("update-note", id, data),
  deleteNote: (id)       => ipcRenderer.invoke("delete-note", id),
  openNoteWindow: (id)   => ipcRenderer.invoke("open-note-window", id),

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

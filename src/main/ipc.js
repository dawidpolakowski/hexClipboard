const { ipcMain, clipboard, app, BrowserWindow, Notification } = require("electron");
const store = require("./store");

// `deps` lets main.js share the live clipboard/private-mode state with the handlers:
//   getPrivateMode()        -> boolean
//   setPrivateMode(enabled) -> void (updates tray + poller, broadcasts to renderer)
//   setLastText(text)       -> void (keeps the poller from re-capturing a paste)
function registerIpcHandlers(deps = {}) {
  const { getPrivateMode, setPrivateMode, setLastText } = deps;

  // ── History ──────────────────────────────────────────────────────────────
  ipcMain.handle("get-history", () => store.getHistory());

  ipcMain.handle("copy-item", (_, id) => {
    const item = store.findItem(id);
    if (item) {
      clipboard.writeText(item.text);
      if (setLastText) setLastText(item.text);
    }
  });

  // Copy arbitrary text (workbench: combined / edited selection).
  ipcMain.handle("copy-text", (_, text) => {
    if (typeof text === "string" && text.length) {
      clipboard.writeText(text);
      if (setLastText) setLastText(text);
    }
  });

  ipcMain.handle("pin-item", (_, id) => store.togglePin(id));
  ipcMain.handle("delete-item", (_, id) => store.deleteItem(id));
  ipcMain.handle("clear-history", () => store.clearHistory());

  // ── Private mode ─────────────────────────────────────────────────────────
  ipcMain.handle("get-private-mode", () => (getPrivateMode ? getPrivateMode() : false));
  ipcMain.handle("set-private-mode", (_, enabled) => {
    if (setPrivateMode) setPrivateMode(!!enabled);
    return getPrivateMode ? getPrivateMode() : false;
  });

  // ── Window controls ──────────────────────────────────────────────────────
  ipcMain.handle("win-minimize", () => BrowserWindow.getFocusedWindow()?.minimize());
  ipcMain.handle("win-maximize", () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.handle("win-hide", () => BrowserWindow.getFocusedWindow()?.hide());
  ipcMain.handle("win-quit", () => app.quit());

  // ── System ───────────────────────────────────────────────────────────────
  ipcMain.handle("notify", (_, title, body) => {
    if (Notification.isSupported()) new Notification({ title, body }).show();
  });

  ipcMain.handle("get-login-item", () => app.getLoginItemSettings().openAtLogin);
  ipcMain.handle("set-login-item", (_, enabled) => {
    if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: !!enabled });
  });

  ipcMain.handle("get-version", () => app.getVersion());
}

module.exports = { registerIpcHandlers };

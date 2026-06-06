const { ipcMain, clipboard, app, BrowserWindow, Notification, screen } = require("electron");
const store = require("./store");
const notes = require("./notesStore");

// `deps` lets main.js share the live clipboard/private-mode state with the handlers:
//   getPrivateMode()        -> boolean
//   setPrivateMode(enabled) -> void (updates tray + poller, broadcasts to renderer)
//   setLastText(text)       -> void (keeps the poller from re-capturing a paste)
function registerIpcHandlers(deps = {}) {
  const { getPrivateMode, setPrivateMode, setLastText, openNoteWindow } = deps;

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
  ipcMain.handle("set-title", (_, id, title) => store.setTitle(id, title));
  ipcMain.handle("set-pos", (_, id, x, y) => store.setPos(id, x, y));
  ipcMain.handle("delete-item", (_, id) => store.deleteItem(id));
  ipcMain.handle("clear-history", () => store.clearHistory());

  // ── Notes ───────────────────────────────────────────────────────────────────
  ipcMain.handle("get-notes", () => notes.getNotes());
  ipcMain.handle("create-note", (_, data) => {
    const note = notes.createNote();
    if (data && (data.title || data.body || data.type)) {
      notes.updateNote(note.id, data);
      return notes.getNotes().find((n) => n.id === note.id);
    }
    return note;
  });
  ipcMain.handle("update-note", (_, id, data) => notes.updateNote(id, data));
  ipcMain.handle("delete-note", (_, id) => notes.deleteNote(id));
  ipcMain.handle("open-note-window", (_, id) => { if (openNoteWindow) openNoteWindow(id); });

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

  // ── Sticky note window controls (act on the sender's window) ───────────────
  // Dock to a screen edge, top-aligned, stacking under any notes already docked
  // to that same side (no overlap).
  ipcMain.handle("note-dock", (e, side) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win) return;
    const { workArea } = screen.getDisplayMatching(win.getBounds());
    const [width, height] = win.getSize();
    const x = side === "right" ? workArea.x + workArea.width - width : workArea.x;
    const GAP = 6;
    let y = workArea.y;
    for (const w of BrowserWindow.getAllWindows()) {
      if (w === win || w.isDestroyed() || w.__dockSide !== side) continue;
      const b = w.getBounds();
      y = Math.max(y, b.y + b.height + GAP);
    }
    const maxY = workArea.y + workArea.height - height;
    if (y > maxY) y = Math.max(workArea.y, maxY);
    win.__dockSide = side;
    win.setBounds({ x, y, width, height });
  });
  // Locked: fixed in place + always on top (renderer makes it read-only too).
  ipcMain.handle("note-set-lock", (e, locked) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win) return false;
    win.setMovable(!locked);
    win.setResizable(!locked);
    win.setAlwaysOnTop(!!locked);
    return !!locked;
  });
  ipcMain.handle("note-set-size", (e, w, h) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) win.setContentSize(Math.round(w), Math.round(h));
  });
  ipcMain.handle("note-close", (e) => BrowserWindow.fromWebContents(e.sender)?.close());

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

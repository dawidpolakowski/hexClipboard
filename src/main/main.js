const { app, Tray, Menu, dialog, globalShortcut, clipboard, nativeImage } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

const { registerIpcHandlers } = require("./ipc");
const { createWindow } = require("./window");
const store = require("./store");
const { detectType } = require("../utils/detectType");

let mainWindow = null;
let tray = null;
let pollInterval = null;
let isPrivateMode = false;
let lastText = "";

// ── Tray icon ─────────────────────────────────────────────────────────────────
function makeTrayIcon() {
  const file = process.platform === "win32" ? "icon-tray.ico" : "icon-tray-64.png";
  const icon = nativeImage.createFromPath(path.join(__dirname, "../../assets", file));
  return icon.isEmpty()
    ? nativeImage.createFromPath(path.join(__dirname, "../../assets/tray-icon.png"))
    : icon;
}

// ── Error boundaries ────────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  dialog.showErrorBox("Unexpected error", err.message || String(err));
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

// ── App menu (macOS needs an Edit menu for copy/paste; hidden on Win/Linux) ───
function createAppMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: "about" }, { type: "separator" }, { role: "services" },
            { type: "separator" }, { role: "hide" }, { role: "hideOthers" },
            { role: "unhide" }, { type: "separator" }, { role: "quit" },
          ],
        }]
      : []),
    {
      label: "Edit",
      submenu: [
        { role: "undo" }, { role: "redo" }, { type: "separator" },
        { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" },
      ],
    },
  ];
  Menu.setApplicationMenu(isMac ? Menu.buildFromTemplate(template) : null);
}

// ── Window helpers ────────────────────────────────────────────────────────────
function showWindow(tab) {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send("refresh-history", store.getHistory());
  if (tab) mainWindow.webContents.send("switch-tab", tab);
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
}

function broadcastHistory() {
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.webContents.send("refresh-history", store.getHistory());
  }
}

// ── Private mode ──────────────────────────────────────────────────────────────
function setPrivateMode(enabled) {
  isPrivateMode = enabled;
  if (tray) {
    tray.setToolTip(isPrivateMode ? "hexClipboard (private)" : "hexClipboard");
    tray.setContextMenu(buildTrayMenu());
  }
  mainWindow?.webContents.send("private-mode", isPrivateMode);
}

// ── Clipboard polling ─────────────────────────────────────────────────────────
function startPolling() {
  pollInterval = setInterval(() => {
    if (isPrivateMode) return;
    try {
      const text = clipboard.readText();
      if (text && text !== lastText && text.trim().length > 0) {
        lastText = text;
        store.addToHistory({
          id: Date.now(),
          text,
          type: detectType(text),
          time: Date.now(),
          pinned: false,
        });
        broadcastHistory();
      }
    } catch {
      // Ignore transient clipboard read failures.
    }
  }, 500);
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: `hexClipboard v${app.getVersion()}`, enabled: false },
    { type: "separator" },
    { label: "Open", accelerator: "Ctrl+Shift+V", click: () => showWindow() },
    { label: "Hex grid view", accelerator: "Ctrl+Shift+H", click: () => showWindow("hex") },
    { type: "separator" },
    {
      label: isPrivateMode ? "Disable private mode" : "Enable private mode",
      accelerator: "Ctrl+Shift+X",
      click: () => setPrivateMode(!isPrivateMode),
    },
    {
      label: "Clear history",
      click: () => { store.clearHistory(); broadcastHistory(); },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
}

function createTray() {
  tray = new Tray(makeTrayIcon());
  tray.setToolTip("hexClipboard");
  tray.setContextMenu(buildTrayMenu());
  tray.on("click", toggleWindow);
  tray.on("double-click", () => showWindow());
}

// ── Global shortcuts ──────────────────────────────────────────────────────────
function registerShortcuts() {
  globalShortcut.register("Ctrl+Shift+V", toggleWindow);
  globalShortcut.register("Ctrl+Shift+H", () => showWindow("hex"));
  globalShortcut.register("Ctrl+Shift+X", () => setPrivateMode(!isPrivateMode));
  globalShortcut.register("Ctrl+Shift+P", () => {
    const history = store.getHistory();
    if (history.length > 0) {
      store.togglePin(history[0].id);
      broadcastHistory();
    }
  });
}

// ── Single instance ───────────────────────────────────────────────────────────
app.setAppUserModelId("com.dawidpolakowski.hexclipboard");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => showWindow());
}

app.whenReady().then(() => {
  if (!gotLock) return;
  app.setName("hexClipboard");
  console.log(`[main] ready — v${app.getVersion()} packaged=${app.isPackaged} platform=${process.platform}`);

  createAppMenu();
  mainWindow = createWindow();
  createTray();

  registerIpcHandlers({
    getPrivateMode: () => isPrivateMode,
    setPrivateMode,
    setLastText: (t) => { lastText = t; },
  });

  registerShortcuts();
  startPolling();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on("update-downloaded", () => {
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Update ready",
        message: "A new version has been downloaded. Restart hexClipboard to apply it.",
        buttons: ["Restart now", "Later"],
      }).then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
    });
  }
});

app.on("activate", () => showWindow());

app.on("before-quit", () => { app.isQuitting = true; });

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (pollInterval) clearInterval(pollInterval);
});

// Keep running in the tray when all windows are closed.
app.on("window-all-closed", (e) => e.preventDefault());

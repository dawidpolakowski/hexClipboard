const { BrowserWindow, app, screen } = require("electron");
const path = require("path");
const { loadWindowState, saveWindowState } = require("./windowState");

const isDev = process.argv.includes("--dev") || process.env.DEV === "true";
const ICON_PATH = process.platform === "win32"
  ? path.join(__dirname, "../../assets/icon.ico")
  : path.join(__dirname, "../../assets/icon.png");

function createWindow() {
  const state = loadWindowState();

  // If the saved position lands off every display, drop it so the window centers.
  let { x, y } = state;
  if (x !== undefined && y !== undefined) {
    const display = screen.getDisplayNearestPoint({ x, y });
    const b = display.bounds;
    if (x < b.x || y < b.y || x >= b.x + b.width || y >= b.y + b.height) {
      x = undefined;
      y = undefined;
    }
  }

  const win = new BrowserWindow({
    x,
    y,
    width: state.width,
    height: state.height,
    minWidth: 520,
    minHeight: 420,
    show: false,
    frame: false,
    icon: ICON_PATH,
    backgroundColor: "#0c0c10",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "../renderer/index.html"));

  if (isDev) win.webContents.openDevTools({ mode: "detach" });

  // Persist size & position on change.
  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      saveWindowState(win.getBounds());
    }
  };
  win.on("resize", saveState);
  win.on("move", saveState);

  // Hide to tray instead of closing.
  win.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  return win;
}

module.exports = { createWindow };

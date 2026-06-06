const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const stateFile = path.join(app.getPath("userData"), "window-state.json");

function loadWindowState() {
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile));
    }
  } catch (err) {
    console.error("Failed to load window state:", err);
  }

  return {
    width: 960,
    height: 680,
  };
}

function saveWindowState(bounds) {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(bounds));
  } catch (err) {
    console.error("Failed to save window state:", err);
  }
}

module.exports = { loadWindowState, saveWindowState };

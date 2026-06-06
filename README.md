# Hexbench

> A honeycomb workbench for your clipboard, notes, and text tools. Built with Electron.

![Hexbench](https://img.shields.io/badge/version-1.0.0-d4af37?style=flat-square) ![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-afa9ec?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-5dcaa5?style=flat-square) [![Build](https://github.com/dawidpolakowski/Hexbench/actions/workflows/build.yml/badge.svg)](https://github.com/dawidpolakowski/Hexbench/actions/workflows/build.yml)

## Download

**[⬇ Latest Windows build](https://github.com/dawidpolakowski/Hexbench/releases/latest)**

Hexbench sits quietly in your system tray and captures every copy you make — text, links, and code. Retrieve anything instantly with a global shortcut and smart search, browse your whole history in the signature honeycomb grid, gather snippets in the workbench, and keep your own notes alongside.

## Features

### Clipboard
- **List & Hex grid views** — a fast searchable list or an interlocking honeycomb
- **Drag & magnetic snap** — rearrange hexes freely; they snap to clean honeycomb slots
- **Saved section** — pinned items get their own separated band at the top
- **Titles** — give any item a custom title shown on its hex
- **Smart type detection** — auto-classifies text, links, and code
- **Workbench** — multi-select hexes to gather their text into an editable, resizable
  pad (1 line → 80% of the window); copy it, or save it as a note
- **Private mode** — pause capture with `Ctrl+Shift+X`

### Notes (crafted, not captured)
- **List & Grid layouts** — vertical list with editor, or draggable rectangle cards
  (magnetic snapping in grid mode)
- **Two content types** — plain text or a bullet / numbered list, with a live preview
- **Open in its own window** — pop any note out as a standalone plain-text window

### Everywhere
- **Themes** — Dark (gold), GitHub Dark, and Light
- **Lightweight & cross-platform** — runs in the tray on Windows, macOS, Linux

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+V` | Show / hide the window |
| `Ctrl+Shift+H` | Open the hex grid view |
| `Ctrl+Shift+X` | Toggle private mode |
| `Ctrl+Shift+P` | Pin (save) the last copied item |
| `Esc` | Hide window / close dialog |

In the hex grid: **click** to select, **drag** to move (snaps to grid), **double-click** to reset position.

## Getting started

```bash
git clone https://github.com/dawidpolakowski/Hexbench.git
cd Hexbench
npm install

npm run dev            # run with DevTools
npm run lint           # ESLint
npm run icons          # regenerate icons (PNG + ICO + SVG)

npm run build:win      # package: Windows
npm run build:mac      # macOS
npm run build:linux    # Linux
```

## Project structure

```
Hexbench/
├── src/
│   ├── main/
│   │   ├── main.js          # App lifecycle, tray, global shortcuts, clipboard polling
│   │   ├── ipc.js           # ipcMain handlers
│   │   ├── window.js        # Main window + standalone note window
│   │   ├── windowState.js   # Window bounds persistence
│   │   ├── store.js         # Clipboard history store (electron-store)
│   │   └── notesStore.js    # Notes store (electron-store)
│   ├── preload/
│   │   └── preload.js       # Context bridge — secure IPC (window.hexClip)
│   ├── renderer/
│   │   ├── index.html       # Main window: List / Hex grid / Notes
│   │   ├── renderer.js      # Renderer logic
│   │   ├── styles.css       # Design tokens + theming
│   │   ├── note.html        # Standalone note window
│   │   └── note.js          # Standalone note window logic
│   └── utils/
│       └── detectType.js    # Text/link/code classification
├── scripts/
│   └── generate-icons.js    # Dependency-free icon generator
├── assets/                  # Generated icons (npm run icons)
├── eslint.config.mjs
├── package.json
└── README.md
```

## Tech stack

- [Electron](https://electronjs.org) — cross-platform desktop shell
- [electron-store](https://github.com/sindresorhus/electron-store) — local persistence for clipboard history & notes
- [electron-updater](https://www.electron.build/auto-update) — auto-updates from GitHub releases
- Vanilla JS + HTML/CSS renderer (no framework overhead)

## License

MIT © [Dawid Polakowski](https://github.com/dawidpolakowski)

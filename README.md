# hexClipboard

> Clipboard history manager with a hex grid browser. Built with Electron.

![hexClipboard](https://img.shields.io/badge/version-1.0.0-7f77dd?style=flat-square) ![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-afa9ec?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-5dcaa5?style=flat-square) [![Build](https://github.com/dawidpolakowski/hexClipboard/actions/workflows/build.yml/badge.svg)](https://github.com/dawidpolakowski/hexClipboard/actions/workflows/build.yml)

## Download

**[⬇ Latest Windows build](https://github.com/dawidpolakowski/hexClipboard/releases/latest)**

hexClipboard sits quietly in your system tray and captures every copy you make — text, links, and code. Retrieve anything instantly with a global shortcut, smart search, and pinned favourites. One window, two views: a fast searchable list and the signature hexagonal grid.

## Features

- **Single window, two views** — toggle between a searchable **List** and the **Hex grid** browser
- **Instant access** — pop open with `Ctrl+Shift+V`, type to search, click to paste
- **Smart type detection** — auto-classifies text, links, and code snippets
- **Pinned favourites** — pin items that survive restarts and history clears
- **Private mode** — pause recording with `Ctrl+Shift+X`
- **Themes** — Dark (gold), GitHub Dark, and Light
- **Lightweight** — runs in the system tray, minimal RAM footprint
- **Cross-platform** — Windows, macOS, Linux

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+V` | Show / hide the window |
| `Ctrl+Shift+H` | Open the hex grid view |
| `Ctrl+Shift+X` | Toggle private mode |
| `Ctrl+Shift+P` | Pin last copied item |
| `Esc` | Hide window / close dialog |

## Getting started

```bash
# Clone the repo
git clone https://github.com/dawidpolakowski/hexClipboard.git
cd hexClipboard

# Install dependencies
npm install

# Run in development
npm run dev

# Regenerate icons (PNG + ICO + SVG)
npm run icons

# Build for your platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Project structure

```
hexClipboard/
├── src/
│   ├── main/
│   │   ├── main.js          # App lifecycle, tray, global shortcuts, clipboard polling
│   │   ├── ipc.js           # ipcMain handlers
│   │   ├── window.js        # Main window creation
│   │   ├── windowState.js   # Window bounds persistence
│   │   └── store.js         # Clipboard history store (electron-store)
│   ├── preload/
│   │   └── preload.js       # Context bridge — secure IPC (window.hexClip)
│   ├── renderer/
│   │   ├── index.html       # Single window: List + Hex grid views
│   │   ├── renderer.js      # Renderer logic
│   │   └── styles.css       # Design tokens + theming
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
- [electron-store](https://github.com/sindresorhus/electron-store) — persistent local storage for clipboard history
- Vanilla JS + HTML/CSS renderer (no framework overhead)

## Roadmap

- [ ] Image clipboard support
- [ ] Syntax highlighting for code entries
- [ ] App whitelist / blacklist for private mode
- [ ] AES-256 encrypted storage option
- [ ] Cloud sync (optional)
- [ ] Custom global shortcut configuration

## License

MIT © [Dawid Polakowski](https://github.com/dawidpolakowski)

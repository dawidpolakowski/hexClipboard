# hexClipboard

> Clipboard history manager with a hex grid browser. Built with Electron.

![hexClipboard](https://img.shields.io/badge/version-1.0.0-7f77dd?style=flat-square) ![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-afa9ec?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-5dcaa5?style=flat-square)

hexClipboard sits quietly in your system tray and captures every copy you make — text, links, and code. Retrieve anything instantly with a global shortcut, smart search, and pinned favourites. Browse your full history in the signature hexagonal grid view.

## Features

- **Instant picker** — pop open with `Ctrl+Shift+V`, type to search, click to paste
- **Hex grid browser** — visualise your entire history as a zoomable honeycomb
- **Smart type detection** — auto-classifies text, links, and code snippets
- **Pinned favourites** — pin items that survive restarts and history clears
- **Private mode** — pause recording with `Ctrl+Shift+X`
- **Lightweight** — runs in the system tray, minimal RAM footprint
- **Cross-platform** — Windows, macOS, Linux

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+V` | Open / close picker |
| `Ctrl+Shift+H` | Open hex grid view |
| `Ctrl+Shift+X` | Toggle private mode |
| `Ctrl+Shift+P` | Pin last copied item |
| `Esc` | Dismiss picker |

## Getting started

```bash
# Clone the repo
git clone https://github.com/dawidpolakowski/hexClipboard.git
cd hexClipboard

# Install dependencies
npm install

# Run in development
npm run dev

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
│   │   ├── main.js          # Main process, tray, global shortcuts, clipboard polling
│   │   └── preload.js       # Context bridge — secure IPC between main and renderer
│   └── renderer/
│       ├── picker.html      # Quick picker popup window
│       └── hex.html         # Full hex grid browser window
├── assets/
│   └── tray-icon.png        # 16×16 tray icon (provide your own)
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

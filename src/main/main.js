const { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, ipcMain, nativeImage } = require('electron')
const path = require('path')
const Store = require('electron-store')

const store = new Store()
const isDev = process.argv.includes('--dev')

let tray = null
let pickerWindow = null
let hexWindow = null
let isPrivateMode = false
let pollInterval = null

const MAX_HISTORY = 500
let lastText = ''

function createPickerWindow() {
  pickerWindow = new BrowserWindow({
    width: 380,
    height: 520,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  pickerWindow.loadFile(path.join(__dirname, '../renderer/picker.html'))

  pickerWindow.on('blur', () => {
    pickerWindow.hide()
  })

  if (isDev) pickerWindow.webContents.openDevTools({ mode: 'detach' })
}

function createHexWindow() {
  hexWindow = new BrowserWindow({
    width: 900,
    height: 660,
    show: false,
    frame: true,
    title: 'hexClipboard — Hex Grid',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  hexWindow.loadFile(path.join(__dirname, '../renderer/hex.html'))
  hexWindow.on('closed', () => { hexWindow = null })
}

function togglePicker() {
  if (!pickerWindow) createPickerWindow()

  if (pickerWindow.isVisible()) {
    pickerWindow.hide()
  } else {
    pickerWindow.show()
    pickerWindow.focus()
    pickerWindow.webContents.send('refresh-history', getHistory())
  }
}

function openHexView() {
  if (!hexWindow) createHexWindow()
  hexWindow.show()
  hexWindow.focus()
  hexWindow.webContents.send('refresh-history', getHistory())
}

function getHistory() {
  return store.get('history', [])
}

function addToHistory(entry) {
  let history = getHistory()
  const duplicate = history.findIndex(h => h.text === entry.text)
  if (duplicate !== -1) history.splice(duplicate, 1)
  history.unshift(entry)
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY)
  store.set('history', history)
}

function startPolling() {
  pollInterval = setInterval(() => {
    if (isPrivateMode) return
    try {
      const text = clipboard.readText()
      if (text && text !== lastText && text.trim().length > 0) {
        lastText = text
        const type = detectType(text)
        addToHistory({ id: Date.now(), text, type, time: Date.now(), pinned: false })
        if (pickerWindow?.isVisible()) {
          pickerWindow.webContents.send('refresh-history', getHistory())
        }
      }
    } catch (_) {}
  }, 500)
}

function detectType(text) {
  if (/^https?:\/\//i.test(text.trim())) return 'link'
  if (/[\{\}\[\];]/.test(text) || /^\s*(const|let|var|function|import|export|def |class |if |for |while )/.test(text)) return 'code'
  return 'text'
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: 'hexClipboard', enabled: false },
    { type: 'separator' },
    { label: 'Open picker', accelerator: 'Ctrl+Shift+V', click: togglePicker },
    { label: 'Hex grid view', accelerator: 'Ctrl+Shift+H', click: openHexView },
    { type: 'separator' },
    {
      label: isPrivateMode ? 'Disable private mode' : 'Enable private mode',
      accelerator: 'Ctrl+Shift+X',
      click: () => {
        isPrivateMode = !isPrivateMode
        tray.setToolTip(isPrivateMode ? 'hexClipboard (private)' : 'hexClipboard')
        tray.setContextMenu(buildTrayMenu())
      }
    },
    { label: 'Clear history', click: () => { store.set('history', store.get('history', []).filter(h => h.pinned)) } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
}

app.whenReady().then(() => {
  app.setName('hexClipboard')

  const icon = nativeImage.createFromPath(path.join(__dirname, '../../assets/tray-icon.png'))
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
  tray.setToolTip('hexClipboard')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', togglePicker)

  createPickerWindow()

  globalShortcut.register('Ctrl+Shift+V', togglePicker)
  globalShortcut.register('Ctrl+Shift+H', openHexView)
  globalShortcut.register('Ctrl+Shift+X', () => {
    isPrivateMode = !isPrivateMode
    tray.setContextMenu(buildTrayMenu())
  })
  globalShortcut.register('Ctrl+Shift+P', () => {
    const history = getHistory()
    if (history.length > 0) {
      history[0].pinned = !history[0].pinned
      store.set('history', history)
    }
  })

  startPolling()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (pollInterval) clearInterval(pollInterval)
})

app.on('window-all-closed', (e) => e.preventDefault())

ipcMain.handle('get-history', () => getHistory())
ipcMain.handle('copy-item', (_, id) => {
  const item = getHistory().find(h => h.id === id)
  if (item) { clipboard.writeText(item.text); lastText = item.text }
})
ipcMain.handle('pin-item', (_, id) => {
  const history = getHistory()
  const item = history.find(h => h.id === id)
  if (item) { item.pinned = !item.pinned; store.set('history', history) }
  return getHistory()
})
ipcMain.handle('delete-item', (_, id) => {
  store.set('history', getHistory().filter(h => h.id !== id))
  return getHistory()
})
ipcMain.handle('clear-history', () => {
  store.set('history', getHistory().filter(h => h.pinned))
  return getHistory()
})
ipcMain.handle('hide-picker', () => pickerWindow?.hide())

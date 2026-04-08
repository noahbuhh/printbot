const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, net } = require('electron')
const path = require('path')
const fs   = require('fs')

// ── Persistent config ────────────────────────────────────────────────────────
const configPath = path.join(app.getPath('userData'), 'config.json')

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')) } catch { return {} }
}
function saveConfig(data) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2))
}

let config = Object.assign(
  { piUrl: 'http://192.168.178.79', remoteUrl: '', connectionMode: 'auto' },
  loadConfig()
)

// ── State ────────────────────────────────────────────────────────────────────
let win        = null
let tray       = null
let activeUrl  = null   // which URL is currently loaded
let didFallback = false // prevent infinite fallback loop

// ── Tray icon (inline 16×16 PNG) ─────────────────────────────────────────────
const TRAY_ICON_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA' +
  'AAAAA0lEQVQ4y2NgGAWDGfz//58BAALEAAIAAAAAElFTkSuQmCC'

function getTrayIcon() {
  try {
    const icoPath = path.join(__dirname, 'assets', 'icon.ico')
    if (fs.existsSync(icoPath)) return nativeImage.createFromPath(icoPath)
  } catch {}
  return nativeImage.createFromDataURL('data:image/png;base64,' + TRAY_ICON_B64)
}

// ── URL resolution ────────────────────────────────────────────────────────────
function canReach(url) {
  return new Promise((resolve) => {
    try {
      const req = net.request({ url, method: 'HEAD' })
      const timer = setTimeout(() => { req.abort(); resolve(false) }, 3000)
      req.on('response', () => { clearTimeout(timer); resolve(true) })
      req.on('error', () => { clearTimeout(timer); resolve(false) })
      req.end()
    } catch {
      resolve(false)
    }
  })
}

async function resolveUrl() {
  const mode   = config.connectionMode || 'auto'
  const local  = config.piUrl
  const remote = config.remoteUrl

  if (mode === 'local')  return local
  if (mode === 'remote') return remote || local
  // auto: probe local first, fall back to remote
  if (!remote) return local
  const ok = await canReach(local)
  return ok ? local : remote
}

// ── Main window ──────────────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Autoprint',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#0a0b0e',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.once('ready-to-show', () => win.show())

  loadMainContent()

  win.webContents.on('did-fail-load', (event, errorCode, _desc, _url, isMainFrame) => {
    if (!isMainFrame) return
    // In auto mode, if we haven't already tried the fallback, try the other URL
    if (config.connectionMode === 'auto' && !didFallback && config.remoteUrl) {
      didFallback = true
      const fallback = activeUrl === config.piUrl ? config.remoteUrl : config.piUrl
      activeUrl = fallback
      win.loadURL(fallback)
      updateTrayTooltip()
    } else {
      win.loadFile(path.join(__dirname, 'error.html'))
    }
  })

  win.webContents.on('did-navigate', () => {
    didFallback = false  // reset on successful navigation
    updateTrayTooltip()
    updateTray()
  })

  // Open external links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      win.hide()
    }
  })

  buildMenu()
}

async function loadMainContent() {
  didFallback = false
  activeUrl   = await resolveUrl()
  win.loadURL(activeUrl)
  updateTrayTooltip()
}

// ── Menu bar ─────────────────────────────────────────────────────────────────
function buildMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Autoprint',
      submenu: [
        {
          label: 'Settings…',
          accelerator: 'CmdOrCtrl+,',
          click: openSettings,
        },
        { type: 'separator' },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => win && win.webContents.reload() },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => { app.isQuiting = true; app.quit() } },
      ],
    },
    {
      label: 'Connection',
      submenu: [
        {
          label: 'Auto (local → remote)',
          type: 'radio',
          checked: config.connectionMode === 'auto',
          click: () => setMode('auto'),
        },
        {
          label: 'Local only',
          type: 'radio',
          checked: config.connectionMode === 'local',
          click: () => setMode('local'),
        },
        {
          label: 'Remote only',
          type: 'radio',
          checked: config.connectionMode === 'remote',
          click: () => setMode('remote'),
        },
        { type: 'separator' },
        { label: 'Reconnect', click: () => win && loadMainContent() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In',  accelerator: 'CmdOrCtrl+Plus',  click: () => win && win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-',     click: () => win && win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5) },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0',  click: () => win && win.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { label: 'Toggle DevTools', accelerator: 'F12', click: () => win && win.webContents.toggleDevTools() },
      ],
    },
  ])
  Menu.setApplicationMenu(menu)
}

function setMode(mode) {
  config.connectionMode = mode
  saveConfig(config)
  buildMenu()
  if (win) loadMainContent()
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function createTray() {
  tray = new Tray(getTrayIcon())
  updateTrayTooltip()
  updateTray()
  tray.on('click', showWindow)
}

function updateTrayTooltip() {
  if (!tray) return
  const label = activeUrl === config.remoteUrl ? 'remote' : 'local'
  tray.setToolTip(`Autoprint — ${label}: ${activeUrl || '…'}`)
}

function updateTray() {
  if (!tray) return
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open',     click: showWindow },
    { label: 'Settings', click: openSettings },
    { type: 'separator' },
    {
      label: 'Connection',
      submenu: [
        { label: 'Auto',   type: 'radio', checked: config.connectionMode === 'auto',   click: () => setMode('auto')   },
        { label: 'Local',  type: 'radio', checked: config.connectionMode === 'local',  click: () => setMode('local')  },
        { label: 'Remote', type: 'radio', checked: config.connectionMode === 'remote', click: () => setMode('remote') },
      ],
    },
    { label: 'Reconnect', click: () => win && loadMainContent() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit() } },
  ]))
}

function showWindow() {
  if (!win) return
  win.show()
  win.focus()
}

// ── Settings dialog ───────────────────────────────────────────────────────────
function openSettings() {
  const settingsWin = new BrowserWindow({
    width: 440,
    height: 300,
    resizable: false,
    title: 'Settings',
    parent: win,
    modal: true,
    backgroundColor: '#111318',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  settingsWin.setMenuBarVisibility(false)
  settingsWin.loadFile(path.join(__dirname, 'settings.html'))
}

ipcMain.handle('get-config', () => config)

ipcMain.handle('save-config', (_, newConfig) => {
  config = Object.assign(config, newConfig)
  saveConfig(config)
  buildMenu()
  if (win) loadMainContent()
})

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('activate', showWindow)           // macOS dock click
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray on Windows/Linux
  }
})

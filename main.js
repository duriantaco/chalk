const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');
const { globalShortcut } = require('electron')
const DEBUG = !!process.env.CHALK_DEBUG;
const { ipcMain, dialog } = require('electron');

let mainWindow = null;

function resolvePathInsideApp(...parts) {
  const candidate1 = path.join(__dirname, ...parts);
  const candidate2 = path.join(process.resourcesPath, 'app.asar', ...parts);
  return fs.existsSync(candidate1) ? candidate1 : candidate2;
}

function createWindow() {
  const preloadPath = resolvePathInsideApp('preload.js');
  const indexHtml = resolvePathInsideApp('dist', 'index.html');

  if (DEBUG) {
    console.log('__dirname =', __dirname);
    console.log('preloadPath =', preloadPath, 'exists:', fs.existsSync(preloadPath));
    console.log('indexHtml =', indexHtml, 'exists:', fs.existsSync(indexHtml));
  }

  let win;
  try {
    win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition: 'persist:chalk',
        preload: preloadPath,
        devTools: DEBUG || process.env.NODE_ENV !== 'production'
      }
    });
  } catch (e) {
    console.error('[main] BrowserWindow creation failed:', e);
    app.quit();
    return;
  }

  mainWindow = win;

  win.loadFile(indexHtml).catch(err => {
    console.error('loadFile failed:', err);
  });

  if (DEBUG) {
    win.webContents.openDevTools({ mode: 'detach' });
    win.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error('did-fail-load', { code, desc, url });
    });
    win.webContents.on('render-process-gone', (_e, details) => {
      console.error('render-process-gone', details);
    });
    win.webContents.on('console-message', (_e, lvl, msg, line, src) => {
      console.log(`${msg} (${src}:${line})`);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  const accel = 'CmdOrCtrl+Shift+K';
  const ok = globalShortcut.register(accel, () => {
    if (!mainWindow || mainWindow.isDestroyed()) 
      return;

    if (mainWindow.isMinimized()) 
      mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    mainWindow.webContents.send('ui:openQuickAdd');
  });

  if (!ok) {
    console.error('[main] Failed to register global shortcut:', accel);
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

const ATTACH_DIR = path.join(app.getPath('userData'), 'attachments');

app.whenReady().then(() => {
  fs.mkdirSync(ATTACH_DIR, { recursive: true });

  ipcMain.handle('attachments:chooseAndCopy', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['png','jpg','jpeg','gif','webp'] }]
    });
    if (canceled || !filePaths?.length) return [];

    const out = [];
    for (const src of filePaths) {
      const base = path.basename(src);
      const uniq = `${Date.now()}_${Math.random().toString(16).slice(2)}_${base}`;
      const dst  = path.join(ATTACH_DIR, uniq);
      await fs.promises.copyFile(src, dst);
      out.push({
        id: uniq,
        path: dst,
        url: `file://${dst.replace(/\\/g, '/')}`
      });
    }
    return out;
  });
});
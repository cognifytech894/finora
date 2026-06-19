const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;

// ── Start Node.js backend ─────────────────────────────────────────
function startBackend() {
  const backendPath = path.join(__dirname, 'backend', 'server.js');
  backendProcess = spawn(process.execPath, [backendPath], {
    env: { ...process.env, PORT: '5000', NODE_ENV: 'production' },
    stdio: 'pipe',
  });

  backendProcess.stdout.on('data', d => console.log('[backend]', d.toString().trim()));
  backendProcess.stderr.on('data', d => console.error('[backend]', d.toString().trim()));
  backendProcess.on('exit', code => console.log('[backend] exited:', code));
}

// ── Wait until backend is ready ───────────────────────────────────
function waitForBackend(retries = 20, delay = 500) {
  return new Promise((resolve, reject) => {
    const check = (n) => {
      http.get('http://localhost:5000/api/health', res => {
        if (res.statusCode === 200) resolve();
        else retry(n);
      }).on('error', () => retry(n));
    };
    const retry = (n) => {
      if (n <= 0) return reject(new Error('Backend did not start'));
      setTimeout(() => check(n - 1), delay);
    };
    check(retries);
  });
}

// ── Create Electron window ────────────────────────────────────────
function createWindow() {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 1000,
    minHeight: 600,
    title: 'Share Mint',
    backgroundColor: '#050810',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.webContents.setUserAgent(userAgent);

  // Intercept Yahoo Finance requests — add proper headers
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://query1.finance.yahoo.com/*', '*://query2.finance.yahoo.com/*'] },
    (details, callback) => {
      callback({
        requestHeaders: {
          ...details.requestHeaders,
          'User-Agent': userAgent,
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com/',
          'Origin': 'https://finance.yahoo.com',
        }
      });
    }
  );

  // Load the built React app
  mainWindow.loadFile(path.join(__dirname, 'frontend', 'build', 'index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Refresh', accelerator: 'F5', click: () => mainWindow?.reload() },
        { type: 'separator' },
        { label: 'Exit', accelerator: 'Alt+F4', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', accelerator: 'Ctrl+=', click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom Out', accelerator: 'Ctrl+-', click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: 'Reset Zoom', accelerator: 'Ctrl+0', click: () => mainWindow?.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { label: 'Full Screen', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
        { label: 'Developer Tools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Share Mint',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Share Mint',
              message: 'Share Mint v1.0.0',
              detail: 'NSE/BSE Technical Analysis Tool\nReact + Node.js + Electron\n\n⚠️ Sirf educational purpose ke liye.',
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App lifecycle ─────────────────────────────────────────────────
app.whenReady().then(async () => {
  startBackend();
  createMenu();

  try {
    await waitForBackend();
    console.log('Backend ready');
  } catch (e) {
    console.error('Backend startup failed — continuing anyway');
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});

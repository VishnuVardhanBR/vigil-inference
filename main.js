const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      // It's good practice to use a preload script, even if simple
      // preload: path.join(__dirname, 'preload.js') 
    },
  });

  // Load the React app from the Vite dev server
  mainWindow.loadURL('http://localhost:5173');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// Spawns the Python FastAPI backend
function spawnBackend() {
  console.log('Starting Python backend...');
  backendProcess = spawn('uvicorn', ['backend.main:app', '--host', '127.0.0.1', '--port', '8000']);

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  spawnBackend();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Make sure to kill the backend process when the app quits
app.on('will-quit', () => {
  console.log('Killing backend process...');
  if (backendProcess) {
    backendProcess.kill();
  }
});
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

// Import IPC handlers
import { registerFileHandlers } from './ipc/files.ipc';
import { registerHistoryHandlers } from './ipc/history.ipc';
import { registerDuplicateHandlers } from './ipc/duplicates.ipc';
import { registerJobHandlers } from './ipc/jobs.ipc';
import { registerScheduleHandlers } from './ipc/schedules.ipc';
import { registerDialogHandlers } from './ipc/dialogs.ipc';

// Import database
import { initDatabase } from './db';

// Import job processors (must be imported to register them)
import './queue/processors';

// Import scheduler
import { startAllSchedules, stopAllSchedules } from './services/scheduleManager';

// ============================================
// Configuration
// ============================================

// Frontend URLs
const DEV_RENDERER_URL = 'http://localhost:3001'; // Next.js in development
const PROD_RENDERER_URL = 'https://folder-organizer-frontend-k7r8.vercel.app/dashboard'; // Deployed frontend - dashboard

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = is.dev ? 'debug' : 'info';

// Set app user model id for Windows
electronApp.setAppUserModelId('com.filemanager.desktop');

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const preloadPath = join(__dirname, '../preload/index.js');
  log.info(`📦 Preload script path: ${preloadPath}`);
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
    
    // Check for updates (non-blocking)
    if (!is.dev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load the renderer
  if (is.dev) {
    // In development, load the local Next.js frontend
    log.info(`Loading renderer from: ${DEV_RENDERER_URL}`);
    mainWindow.loadURL(DEV_RENDERER_URL);
  } else {
    // In production, load the deployed web app
    log.info(`Loading renderer from: ${PROD_RENDERER_URL}`);
    mainWindow.loadURL(PROD_RENDERER_URL);
  }

  // Open DevTools in development
  if (is.dev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// Register all IPC handlers
function registerAllHandlers(): void {
  registerFileHandlers();
  registerHistoryHandlers();
  registerDuplicateHandlers();
  registerJobHandlers();
  registerScheduleHandlers();
  registerDialogHandlers();

  // App info handlers
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:platform', () => process.platform);
  ipcMain.handle('app:userData', () => app.getPath('userData'));

  log.info('✅ All IPC handlers registered');
}

// Auto-updater events
autoUpdater.on('update-available', (info: { version: string }) => {
  log.info('Update available:', info.version);
  mainWindow?.webContents.send('update:available', info);
});

autoUpdater.on('update-downloaded', (info: { version: string }) => {
  log.info('Update downloaded:', info.version);
  mainWindow?.webContents.send('update:downloaded', info);
  
  // Optionally prompt user to restart
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: `Version ${info.version} has been downloaded. Restart to apply the update?`,
    buttons: ['Restart', 'Later'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (error: Error) => {
  log.error('Auto-updater error:', error);
});

// App lifecycle
app.whenReady().then(async () => {
  log.info('🚀 Starting File Manager Desktop v' + app.getVersion());

  // Optimize app behavior
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  try {
    // Initialize database
    await initDatabase();
    log.info('✅ Database initialized');

    // Register IPC handlers
    registerAllHandlers();

    // Start scheduled tasks
    startAllSchedules();
    log.info('✅ Schedules started');

    // Create window
    createWindow();

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    log.error('❌ Failed to initialize app:', error);
    dialog.showErrorBox(
      'Initialization Error',
      `Failed to start File Manager: ${error instanceof Error ? error.message : String(error)}`
    );
    app.quit();
  }
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  log.info('🛑 Shutting down File Manager...');
  stopAllSchedules();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});

# 🖥️ Electron Desktop App Migration Guide

> **Project:** Smart File Manager  
> **Migration Branch:** `desktop-migration`  
> **Target:** Cross-platform desktop app (Windows, macOS, Linux)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Changes](#architecture-changes)
3. [New Project Structure](#new-project-structure)
4. [Required Dependencies](#required-dependencies)
5. [Database Migration (PostgreSQL → SQLite)](#database-migration)
6. [Job Queue Migration (BullMQ → Local Queue)](#job-queue-migration)
7. [API Migration (HTTP → IPC)](#api-migration)
8. [Electron Setup](#electron-setup)
9. [Frontend Changes](#frontend-changes)
10. [Build & Distribution](#build--distribution)
11. [Landing Page Updates](#landing-page-updates)
12. [Step-by-Step Migration Checklist](#migration-checklist)

---

## 🎯 Overview

### Current Architecture (Web)
```
┌─────────────┐     HTTP      ┌─────────────┐     ┌─────────────┐
│   Next.js   │ ─────────────►│   Fastify   │────►│  PostgreSQL │
│  Frontend   │               │   Backend   │     │   (Neon)    │
└─────────────┘               └──────┬──────┘     └─────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │    Redis    │
                              │   (BullMQ)  │
                              └─────────────┘
```

### Target Architecture (Desktop)
```
┌────────────────────────────────────────────────────────┐
│                    Electron App                         │
│  ┌──────────────────┐      IPC      ┌───────────────┐  │
│  │   Renderer       │ ◄───────────► │     Main      │  │
│  │   (Next.js)      │               │   Process     │  │
│  │                  │               │               │  │
│  │  - React UI      │               │  - File Ops   │  │
│  │  - Components    │               │  - SQLite DB  │  │
│  │  - State Mgmt    │               │  - Job Queue  │  │
│  └──────────────────┘               │  - Scheduler  │  │
│                                     └───────┬───────┘  │
│                                             │          │
│                                     ┌───────▼───────┐  │
│                                     │    SQLite     │  │
│                                     │  (Local DB)   │  │
│                                     └───────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Changes

### What Changes

| Component | Web Version | Desktop Version |
|-----------|-------------|-----------------|
| Database | PostgreSQL (Neon cloud) | SQLite (local file) |
| Job Queue | BullMQ + Redis | better-queue + SQLite |
| API Communication | HTTP REST | Electron IPC |
| File Dialogs | Browser `<input type="file">` | Native OS dialogs |
| Scheduling | node-cron | node-cron + power events |
| Auto-updates | N/A | electron-updater |

### What Stays the Same

- ✅ All React components
- ✅ All UI/UX (shadcn/ui, Tailwind)
- ✅ File scanning logic
- ✅ File classification logic
- ✅ Hash service (SHA-256)
- ✅ File mover service
- ✅ Drizzle ORM (just different driver)
- ✅ TypeScript everywhere

---

## 📁 New Project Structure

```
file-manager/
├── apps/
│   ├── backend/                    # Keep for web version
│   ├── frontend/                   # Keep for web version  
│   └── desktop/                    # NEW - Electron app
│       ├── electron/
│       │   ├── main.ts             # Main process entry
│       │   ├── preload.ts          # Preload script (IPC bridge)
│       │   ├── ipc/
│       │   │   ├── index.ts        # IPC handler registration
│       │   │   ├── files.ipc.ts    # File operations handlers
│       │   │   ├── jobs.ipc.ts     # Job handlers
│       │   │   ├── duplicates.ipc.ts
│       │   │   └── schedules.ipc.ts
│       │   ├── services/           # Backend services (adapted)
│       │   │   ├── fileClassifier.ts
│       │   │   ├── fileMover.ts
│       │   │   ├── hashService.ts
│       │   │   ├── scannerInfo.ts
│       │   │   └── scheduleManager.ts
│       │   ├── db/
│       │   │   ├── index.ts        # SQLite connection
│       │   │   ├── schema.ts       # Same schema, SQLite types
│       │   │   └── migrations/
│       │   ├── queue/
│       │   │   └── localQueue.ts   # File-based job queue
│       │   └── utils/
│       │       ├── paths.ts        # App paths helper
│       │       └── logger.ts       # Desktop logger
│       ├── renderer/               # Next.js app (symlink or copy)
│       │   └── ... (frontend code)
│       ├── resources/              # App icons, assets
│       │   ├── icon.ico            # Windows
│       │   ├── icon.icns           # macOS
│       │   └── icon.png            # Linux
│       ├── package.json
│       ├── electron-builder.yml    # Build configuration
│       └── tsconfig.json
│
├── packages/
│   └── shared/                     # Shared types (unchanged)
│
├── ELECTRON_MIGRATION.md           # This file
└── package.json                    # Root workspace
```

---

## 📦 Required Dependencies

### Desktop App (`apps/desktop/package.json`)

```json
{
  "name": "@file-manager/desktop",
  "version": "1.0.0",
  "main": "dist/electron/main.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-builder",
    "package:win": "electron-builder --win",
    "package:mac": "electron-builder --mac",
    "package:linux": "electron-builder --linux"
  },
  "dependencies": {
    // Database
    "better-sqlite3": "^11.0.0",
    "drizzle-orm": "^0.44.7",
    
    // Job Queue (local, no Redis)
    "better-queue": "^3.8.12",
    "better-queue-sqlite": "^1.0.6",
    
    // Scheduling
    "node-cron": "^4.2.1",
    
    // Utilities
    "electron-store": "^8.2.0",       // Settings storage
    "electron-updater": "^6.1.0",     // Auto-updates
    "electron-log": "^5.1.0",         // Logging
    
    // Shared
    "@file-manager/shared": "*"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "electron-vite": "^2.3.0",
    "@electron-toolkit/preload": "^3.0.0",
    "@electron-toolkit/utils": "^3.0.0",
    "typescript": "^5.9.3"
  }
}
```

---

## 🗄️ Database Migration

### Current: Neon PostgreSQL

**File:** `apps/backend/src/db/index.ts`
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

### New: SQLite (Desktop)

**File:** `apps/desktop/electron/db/index.ts`
```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import * as schema from './schema';

// Store DB in user data directory
const dbPath = path.join(app.getPath('userData'), 'file-manager.db');
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
export { sqlite };
```

### Schema Changes Required

**File:** `apps/desktop/electron/db/schema.ts`

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Change from pgTable to sqliteTable
// Change serial to integer with autoincrement
// Change timestamp to integer (Unix timestamp)

export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  originalPath: text('original_path').notNull(),
  currentPath: text('current_path').notNull(),
  size: integer('size').notNull(),
  extension: text('extension').notNull(),
  category: text('category'),
  hash: text('hash'),
  scannedAt: integer('scanned_at', { mode: 'timestamp' }).notNull(),
  organizedAt: integer('organized_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  fileId: integer('file_id').references(() => files.id),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata'),
});
```

### Migration SQL

```sql
-- apps/desktop/electron/db/migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  original_path TEXT NOT NULL,
  current_path TEXT NOT NULL,
  size INTEGER NOT NULL,
  extension TEXT NOT NULL,
  category TEXT,
  hash TEXT,
  scanned_at INTEGER NOT NULL DEFAULT (unixepoch()),
  organized_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS hash_idx ON files(hash);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  file_id INTEGER REFERENCES files(id),
  timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata TEXT
);
```

---

## 📬 Job Queue Migration

### Current: BullMQ + Redis

**File:** `apps/backend/src/queues/fileQueue.ts`
```typescript
import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis';

export const organizeQueue = new Queue('organizeQueue', {
  connection: redisConfig,
});
```

### New: better-queue + SQLite

**File:** `apps/desktop/electron/queue/localQueue.ts`
```typescript
import Queue from 'better-queue';
import SqliteStore from 'better-queue-sqlite';
import { app } from 'electron';
import path from 'path';
import { EventEmitter } from 'events';

const queueDbPath = path.join(app.getPath('userData'), 'jobs.db');

// Event emitter for job updates
export const jobEvents = new EventEmitter();

// Job store
interface Job {
  id: string;
  type: 'organize' | 'duplicate';
  data: any;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

const jobs = new Map<string, Job>();

// Organize Queue
export const organizeQueue = new Queue(
  async (task: { id: string; sourcePath: string; targetPath: string }, cb) => {
    const job = jobs.get(task.id);
    if (job) {
      job.status = 'active';
      jobEvents.emit('job:active', job);
    }

    try {
      // Import and run organize logic
      const { processOrganize } = await import('../services/organizeProcessor');
      const result = await processOrganize(task, (progress) => {
        if (job) {
          job.progress = progress;
          jobEvents.emit('job:progress', { id: task.id, progress });
        }
      });

      if (job) {
        job.status = 'completed';
        job.result = result;
        job.completedAt = new Date();
        jobEvents.emit('job:completed', job);
      }
      cb(null, result);
    } catch (error) {
      if (job) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        jobEvents.emit('job:failed', job);
      }
      cb(error);
    }
  },
  {
    store: new SqliteStore({ path: queueDbPath }),
    concurrent: 2,
  }
);

// Duplicate Check Queue
export const duplicateQueue = new Queue(
  async (task: { id: string; sourcePath: string }, cb) => {
    // Similar implementation
  },
  {
    store: new SqliteStore({ path: queueDbPath }),
    concurrent: 1,
  }
);

// Helper to add job with tracking
export function addOrganizeJob(sourcePath: string, targetPath: string): string {
  const id = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: Job = {
    id,
    type: 'organize',
    data: { sourcePath, targetPath },
    status: 'waiting',
    progress: 0,
    createdAt: new Date(),
  };
  
  jobs.set(id, job);
  organizeQueue.push({ id, sourcePath, targetPath });
  
  return id;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function getAllJobs(): Job[] {
  return Array.from(jobs.values());
}
```

---

## 🔌 API Migration (HTTP → IPC)

### Current: HTTP Client

**File:** `apps/frontend/lib/api/client.ts`
```typescript
import axios from 'axios';
const apiClient = axios.create({ baseURL: 'http://localhost:5000' });
```

### New: IPC Bridge

#### Preload Script (Bridge)

**File:** `apps/desktop/electron/preload.ts`
```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // File Operations
  scanFiles: (path: string) => ipcRenderer.invoke('files:scan', path),
  classifyFiles: (path: string) => ipcRenderer.invoke('files:classify', path),
  organizeFiles: (sourcePath: string, targetPath: string) => 
    ipcRenderer.invoke('files:organize', { sourcePath, targetPath }),
  undoOrganization: (options?: { fileId?: number; since?: string }) =>
    ipcRenderer.invoke('files:undo', options),
  validatePath: (path: string) => ipcRenderer.invoke('files:validate-path', path),

  // History
  getAllFiles: () => ipcRenderer.invoke('history:files'),
  getFileById: (id: number) => ipcRenderer.invoke('history:file', id),
  getRecentOperations: (limit?: number) => 
    ipcRenderer.invoke('history:operations', limit),

  // Duplicates
  getDuplicates: () => ipcRenderer.invoke('duplicates:list'),
  scanDuplicates: (sourcePath: string) => 
    ipcRenderer.invoke('duplicates:scan', sourcePath),

  // Jobs
  getJob: (id: string) => ipcRenderer.invoke('jobs:get', id),
  getOrganizeJobs: () => ipcRenderer.invoke('jobs:organize:list'),
  getDuplicateJobs: () => ipcRenderer.invoke('jobs:duplicate:list'),
  cancelJob: (id: string) => ipcRenderer.invoke('jobs:cancel', id),

  // Schedules
  getSchedules: () => ipcRenderer.invoke('schedules:list'),
  startSchedule: (name: string) => ipcRenderer.invoke('schedules:start', name),
  stopSchedule: (name: string) => ipcRenderer.invoke('schedules:stop', name),
  triggerSchedule: (name: string) => ipcRenderer.invoke('schedules:trigger', name),

  // Native Dialogs
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  selectFile: () => ipcRenderer.invoke('dialog:select-file'),

  // App Info
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => process.platform,

  // Event listeners
  onJobProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('job:progress', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('job:progress');
  },
  onJobComplete: (callback: (data: any) => void) => {
    ipcRenderer.on('job:completed', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('job:completed');
  },
});

// TypeScript types for renderer
declare global {
  interface Window {
    electronAPI: {
      scanFiles: (path: string) => Promise<any>;
      classifyFiles: (path: string) => Promise<any>;
      organizeFiles: (sourcePath: string, targetPath: string) => Promise<any>;
      undoOrganization: (options?: { fileId?: number; since?: string }) => Promise<any>;
      validatePath: (path: string) => Promise<any>;
      getAllFiles: () => Promise<any>;
      getFileById: (id: number) => Promise<any>;
      getRecentOperations: (limit?: number) => Promise<any>;
      getDuplicates: () => Promise<any>;
      scanDuplicates: (sourcePath: string) => Promise<any>;
      getJob: (id: string) => Promise<any>;
      getOrganizeJobs: () => Promise<any>;
      getDuplicateJobs: () => Promise<any>;
      cancelJob: (id: string) => Promise<any>;
      getSchedules: () => Promise<any>;
      startSchedule: (name: string) => Promise<any>;
      stopSchedule: (name: string) => Promise<any>;
      triggerSchedule: (name: string) => Promise<any>;
      selectDirectory: () => Promise<string | null>;
      selectFile: () => Promise<string | null>;
      getAppVersion: () => Promise<string>;
      getPlatform: string;
      onJobProgress: (callback: (data: any) => void) => () => void;
      onJobComplete: (callback: (data: any) => void) => () => void;
    };
  }
}
```

#### IPC Handlers (Main Process)

**File:** `apps/desktop/electron/ipc/files.ipc.ts`
```typescript
import { ipcMain, dialog } from 'electron';
import { scanInfo } from '../services/scannerInfo';
import { classifyFiles } from '../services/fileClassifier';
import { addOrganizeJob } from '../queue/localQueue';
import { fileController } from '../controller/fileController';
import fs from 'fs/promises';

export function registerFileHandlers() {
  // Scan files
  ipcMain.handle('files:scan', async (_, path: string) => {
    return await scanInfo(path);
  });

  // Classify files
  ipcMain.handle('files:classify', async (_, path: string) => {
    const scanResult = await scanInfo(path);
    const categorized = classifyFiles(scanResult.files);
    
    const categories: Record<string, any[]> = {};
    for (const [category, files] of categorized) {
      categories[category] = files;
    }
    
    return {
      totalFiles: scanResult.totalFiles,
      scannedPath: scanResult.scannedPath,
      scannedAt: scanResult.scannedAt,
      categories,
    };
  });

  // Organize files (queue job)
  ipcMain.handle('files:organize', async (_, { sourcePath, targetPath }) => {
    const jobId = addOrganizeJob(sourcePath, targetPath);
    return {
      success: true,
      jobId,
      status: 'queued',
    };
  });

  // Validate path
  ipcMain.handle('files:validate-path', async (_, path: string) => {
    try {
      const stats = await fs.stat(path);
      await fs.access(path, fs.constants.R_OK);
      return {
        valid: true,
        exists: true,
        isDirectory: stats.isDirectory(),
        readable: true,
      };
    } catch (error: any) {
      return {
        valid: false,
        exists: error.code !== 'ENOENT',
        isDirectory: false,
        readable: false,
        error: error.message,
      };
    }
  });

  // Undo organization
  ipcMain.handle('files:undo', async (_, options) => {
    if (options?.fileId) {
      return await fileController.undoFileMove(options.fileId);
    }
    return await fileController.undoRecentOrganization(options);
  });

  // Native directory picker
  ipcMain.handle('dialog:select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Native file picker
  ipcMain.handle('dialog:select-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
    });
    return result.canceled ? null : result.filePaths[0];
  });
}
```

---

## ⚡ Electron Setup

### Main Process Entry

**File:** `apps/desktop/electron/main.ts`
```typescript
import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { registerAllHandlers } from './ipc';
import { initDatabase } from './db';
import { startAllSchedules, stopAllSchedules } from './services/scheduleManager';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset', // macOS style
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../resources/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load the app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  log.info('🚀 Starting File Manager Desktop...');

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.filemanager.desktop');

  // Initialize database
  await initDatabase();
  log.info('✅ Database initialized');

  // Register IPC handlers
  registerAllHandlers();
  log.info('✅ IPC handlers registered');

  // Start scheduled tasks
  startAllSchedules();
  log.info('✅ Schedules started');

  // Optimize shortcuts
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('🛑 Shutting down...');
  stopAllSchedules();
});
```

### Electron Builder Config

**File:** `apps/desktop/electron-builder.yml`
```yaml
appId: com.filemanager.desktop
productName: File Manager
copyright: Copyright © 2024

directories:
  buildResources: resources
  output: release

files:
  - dist/**/*
  - resources/**/*

# Windows
win:
  target:
    - target: nsis
      arch: [x64, arm64]
  icon: resources/icon.ico
  artifactName: ${productName}-${version}-${arch}-setup.${ext}

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  deleteAppDataOnUninstall: false

# macOS
mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: resources/icon.icns
  category: public.app-category.utilities
  artifactName: ${productName}-${version}-${arch}.${ext}

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

# Linux
linux:
  target:
    - target: AppImage
      arch: [x64, arm64]
    - target: deb
      arch: [x64]
  icon: resources/icon.png
  category: Utility
  artifactName: ${productName}-${version}-${arch}.${ext}

# Auto-update
publish:
  provider: github
  owner: your-username
  repo: file-manager
```

---

## 🎨 Frontend Changes

### Create Desktop-specific API Client

**File:** `apps/frontend/lib/api/desktop-client.ts`
```typescript
// Desktop API client using Electron IPC

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const desktopApi = {
  // Files
  scanFiles: async (path: string) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.scanFiles(path);
  },

  classifyFiles: async (path: string) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.classifyFiles(path);
  },

  organizeFiles: async (sourcePath: string, targetPath: string) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.organizeFiles(sourcePath, targetPath);
  },

  validatePath: async (path: string) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.validatePath(path);
  },

  // History
  getAllFiles: async () => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.getAllFiles();
  },

  getRecentOperations: async (limit = 10) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.getRecentOperations(limit);
  },

  // Duplicates
  getDuplicates: async () => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.getDuplicates();
  },

  scanDuplicates: async (sourcePath: string) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.scanDuplicates(sourcePath);
  },

  // Jobs
  getJob: async (id: string) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.getJob(id);
  },

  listOrganizeJobs: async () => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.getOrganizeJobs();
  },

  listDuplicateJobs: async () => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.getDuplicateJobs();
  },

  // Schedules
  getSchedules: async () => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.getSchedules();
  },

  startSchedule: async (name: string) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.startSchedule(name);
  },

  stopSchedule: async (name: string) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.stopSchedule(name);
  },

  triggerSchedule: async (name: string) => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.triggerSchedule(name);
  },

  // Native dialogs
  selectDirectory: async () => {
    if (!isElectron) throw new Error('Not running in Electron');
    return window.electronAPI.selectDirectory();
  },
};
```

### Universal API Client (Web + Desktop)

**File:** `apps/frontend/lib/api/index.ts`
```typescript
import { apiClient } from './client';        // HTTP client
import { desktopApi } from './desktop-client'; // IPC client

const isElectron = typeof window !== 'undefined' && window.electronAPI;

// Export unified API that works in both web and desktop
export const api = {
  files: {
    scan: isElectron
      ? desktopApi.scanFiles
      : (path: string) => apiClient.get('/scan', { params: { path } }).then(r => r.data),
    
    classify: isElectron
      ? desktopApi.classifyFiles
      : (path: string) => apiClient.get('/api/files/classify', { params: { path } }).then(r => r.data),
    
    organize: isElectron
      ? desktopApi.organizeFiles
      : (sourcePath: string, targetPath: string) => 
          apiClient.post('/api/files/organize', { sourcePath, targetPath }).then(r => r.data),
    
    validatePath: isElectron
      ? desktopApi.validatePath
      : (path: string) => apiClient.post('/api/files/validate-path', { path }).then(r => r.data),
  },

  history: {
    getFiles: isElectron
      ? desktopApi.getAllFiles
      : () => apiClient.get('/api/history/files').then(r => r.data),
    
    getOperations: isElectron
      ? desktopApi.getRecentOperations
      : (limit?: number) => apiClient.get('/api/history/operations', { params: { limit } }).then(r => r.data),
  },

  duplicates: {
    list: isElectron
      ? desktopApi.getDuplicates
      : () => apiClient.get('/api/duplicates').then(r => r.data),
    
    scan: isElectron
      ? desktopApi.scanDuplicates
      : (sourcePath: string) => apiClient.post('/api/duplicates/scan', { sourcePath }).then(r => r.data),
  },

  jobs: {
    get: isElectron
      ? desktopApi.getJob
      : (id: string) => apiClient.get(`/api/jobs/${id}`).then(r => r.data),
    
    listOrganize: isElectron
      ? desktopApi.listOrganizeJobs
      : () => apiClient.get('/api/jobs/organize/list').then(r => r.data),
    
    listDuplicate: isElectron
      ? desktopApi.listDuplicateJobs
      : () => apiClient.get('/api/jobs/duplicate/list').then(r => r.data),
  },

  schedules: {
    list: isElectron
      ? desktopApi.getSchedules
      : () => apiClient.get('/api/schedules').then(r => r.data),
    
    start: isElectron
      ? desktopApi.startSchedule
      : (name: string) => apiClient.post(`/api/schedules/${name}/start`).then(r => r.data),
    
    stop: isElectron
      ? desktopApi.stopSchedule
      : (name: string) => apiClient.post(`/api/schedules/${name}/stop`).then(r => r.data),
    
    trigger: isElectron
      ? desktopApi.triggerSchedule
      : (name: string) => apiClient.post(`/api/schedules/${name}/trigger`).then(r => r.data),
  },

  // Desktop-only features
  dialog: {
    selectDirectory: isElectron ? desktopApi.selectDirectory : null,
  },
};

export const isDesktopApp = isElectron;
```

### Update PathInput Component for Native Dialogs

**File:** `apps/frontend/components/dashboard/PathInput.tsx` (update)
```typescript
// Add native folder picker button for desktop
import { isDesktopApp, api } from '@/lib/api';

// In component:
const handleBrowse = async () => {
  if (isDesktopApp && api.dialog.selectDirectory) {
    const path = await api.dialog.selectDirectory();
    if (path) {
      onChange(path);
    }
  }
};

// In JSX, add browse button:
{isDesktopApp && (
  <Button variant="outline" size="icon" onClick={handleBrowse}>
    <FolderOpen className="h-4 w-4" />
  </Button>
)}
```

---

## 📦 Build & Distribution

### Build Commands

```bash
# Development
cd apps/desktop
npm run dev

# Build for current platform
npm run build
npm run package

# Build for specific platforms
npm run package:win     # Windows (.exe)
npm run package:mac     # macOS (.dmg)
npm run package:linux   # Linux (.AppImage, .deb)
```

### Output Files

```
apps/desktop/release/
├── File Manager-1.0.0-x64-setup.exe     # Windows installer
├── File Manager-1.0.0-arm64-setup.exe   # Windows ARM
├── File Manager-1.0.0-x64.dmg           # macOS Intel
├── File Manager-1.0.0-arm64.dmg         # macOS Apple Silicon
├── File Manager-1.0.0-x64.AppImage      # Linux
└── File Manager-1.0.0-x64.deb           # Debian/Ubuntu
```

### Auto-Update Setup

1. Create GitHub releases
2. Upload built artifacts
3. App will check for updates on startup

---

## 🌐 Landing Page Updates

### Add Download Section

**File:** `apps/frontend/components/landing/Download.tsx`
```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Monitor, Apple, Terminal } from 'lucide-react';

const downloads = [
  {
    platform: 'Windows',
    icon: Monitor,
    description: 'Windows 10/11 (64-bit)',
    url: 'https://github.com/your-username/file-manager/releases/latest/download/File-Manager-setup.exe',
    filename: 'File-Manager-setup.exe',
  },
  {
    platform: 'macOS',
    icon: Apple,
    description: 'macOS 11+ (Intel & Apple Silicon)',
    url: 'https://github.com/your-username/file-manager/releases/latest/download/File-Manager.dmg',
    filename: 'File-Manager.dmg',
  },
  {
    platform: 'Linux',
    icon: Terminal,
    description: 'AppImage (Most distributions)',
    url: 'https://github.com/your-username/file-manager/releases/latest/download/File-Manager.AppImage',
    filename: 'File-Manager.AppImage',
  },
];

export function Download() {
  return (
    <section id="download" className="py-20 md:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Download for Desktop
          </h2>
          <p className="text-lg text-muted-foreground">
            Get the full power of File Manager on your desktop. Free and open source.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {downloads.map((download) => {
            const Icon = download.icon;
            return (
              <Card key={download.platform} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>{download.platform}</CardTitle>
                  <CardDescription>{download.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <a href={download.url} download={download.filename}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Version 1.0.0 • <a href="https://github.com/your-username/file-manager/releases" className="underline">View all releases</a></p>
        </div>
      </div>
    </section>
  );
}
```

### Update Landing Page

**File:** `apps/frontend/app/page.tsx`
```tsx
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Download } from '@/components/landing/Download';  // NEW
import { CTA } from '@/components/landing/CTA';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Download />  {/* NEW - Download section */}
      <CTA />
      {/* Footer */}
    </main>
  );
}
```

---

## ✅ Migration Checklist

### Phase 1: Preparation
- [ ] Create `apps/desktop` directory structure
- [ ] Set up Electron with electron-vite
- [ ] Copy/adapt services from backend
- [ ] Create SQLite database schema

### Phase 2: Core Backend Migration
- [ ] Replace PostgreSQL with SQLite (Drizzle)
- [ ] Replace BullMQ with better-queue
- [ ] Adapt fileController for SQLite
- [ ] Adapt scheduleManager
- [ ] Test all services locally

### Phase 3: IPC Layer
- [ ] Create preload script with all API methods
- [ ] Create IPC handlers for each route
- [ ] Add native dialog handlers
- [ ] Test IPC communication

### Phase 4: Frontend Adaptation
- [ ] Create desktop API client
- [ ] Create unified API wrapper
- [ ] Update PathInput with native dialogs
- [ ] Test all pages in Electron

### Phase 5: Build & Distribution
- [ ] Create app icons (ico, icns, png)
- [ ] Configure electron-builder
- [ ] Build for Windows
- [ ] Build for macOS
- [ ] Build for Linux
- [ ] Set up auto-updater

### Phase 6: Landing Page
- [ ] Create Download component
- [ ] Add to landing page
- [ ] Host release files (GitHub Releases)
- [ ] Add version info and changelog link

### Phase 7: Testing & Polish
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Test on Linux
- [ ] Performance testing
- [ ] Create installer screenshots
- [ ] Write installation guide

---

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-vite](https://electron-vite.org/)
- [electron-builder](https://www.electron.build/)
- [Drizzle ORM SQLite](https://orm.drizzle.team/docs/get-started-sqlite)
- [better-queue](https://github.com/diamondio/better-queue)

---

## ❓ FAQ

**Q: Can I keep the web version too?**
A: Yes! The original `apps/backend` and `apps/frontend` remain unchanged. The desktop app is a separate build.

**Q: How do auto-updates work?**
A: The app checks GitHub Releases on startup. Users get a notification when updates are available.

**Q: What about code signing?**
A: For production, you'll need:
- Windows: EV Code Signing Certificate (~$300-500/year)
- macOS: Apple Developer Account ($99/year)
- Linux: Not required

**Q: Can users choose between web and desktop?**
A: Yes! The landing page will have both options - "Try Online" and "Download Desktop App".

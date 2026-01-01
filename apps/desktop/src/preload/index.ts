import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  // ============ FILE OPERATIONS ============
  files: {
    scan: (path: string) => ipcRenderer.invoke('files:scan', path),
    classify: (path: string) => ipcRenderer.invoke('files:classify', path),
    organize: (sourcePath: string, targetPath: string) =>
      ipcRenderer.invoke('files:organize', { sourcePath, targetPath }),
    undo: (options?: { fileId?: number; since?: string }) =>
      ipcRenderer.invoke('files:undo', options),
    validatePath: (path: string) => ipcRenderer.invoke('files:validate-path', path),
    getUndoable: (since?: string) => ipcRenderer.invoke('files:undoable', since),
  },

  // ============ HISTORY ============
  history: {
    getAllFiles: () => ipcRenderer.invoke('history:files'),
    getFileById: (id: number) => ipcRenderer.invoke('history:file', id),
    getOperations: (limit?: number) => ipcRenderer.invoke('history:operations', limit),
  },

  // ============ DUPLICATES ============
  duplicates: {
    getAll: () => ipcRenderer.invoke('duplicates:list'),
    scan: (sourcePath: string) => ipcRenderer.invoke('duplicates:scan', sourcePath),
    getByFileId: (fileId: number) => ipcRenderer.invoke('duplicates:file', fileId),
  },

  // ============ JOBS ============
  jobs: {
    get: (id: string) => ipcRenderer.invoke('jobs:get', id),
    listOrganize: () => ipcRenderer.invoke('jobs:organize:list'),
    listDuplicate: () => ipcRenderer.invoke('jobs:duplicate:list'),
    cancel: (id: string) => ipcRenderer.invoke('jobs:cancel', id),
    getLogs: (id: string) => ipcRenderer.invoke('jobs:logs', id),
  },

  // ============ SCHEDULES ============
  schedules: {
    list: () => ipcRenderer.invoke('schedules:list'),
    start: (name: string) => ipcRenderer.invoke('schedules:start', name),
    stop: (name: string) => ipcRenderer.invoke('schedules:stop', name),
    trigger: (name: string) => ipcRenderer.invoke('schedules:trigger', name),
  },

  // ============ NATIVE DIALOGS ============
  dialog: {
    selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
    selectFile: (filters?: { name: string; extensions: string[] }[]) =>
      ipcRenderer.invoke('dialog:select-file', filters),
    showMessage: (options: {
      type: 'info' | 'warning' | 'error';
      title: string;
      message: string;
    }) => ipcRenderer.invoke('dialog:show-message', options),
    confirm: (message: string, title?: string) =>
      ipcRenderer.invoke('dialog:confirm', { message, title }),
  },

  // ============ APP INFO ============
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
    getPlatform: () => ipcRenderer.invoke('app:platform'),
    getUserDataPath: () => ipcRenderer.invoke('app:userData'),
  },

  // ============ EVENT LISTENERS ============
  on: {
    jobProgress: (callback: (data: { id: string; progress: number }) => void) => {
      const handler = (_: unknown, data: { id: string; progress: number }) => callback(data);
      ipcRenderer.on('job:progress', handler);
      return () => ipcRenderer.removeListener('job:progress', handler);
    },
    jobCompleted: (callback: (data: { id: string; result: unknown }) => void) => {
      const handler = (_: unknown, data: { id: string; result: unknown }) => callback(data);
      ipcRenderer.on('job:completed', handler);
      return () => ipcRenderer.removeListener('job:completed', handler);
    },
    jobFailed: (callback: (data: { id: string; error: string }) => void) => {
      const handler = (_: unknown, data: { id: string; error: string }) => callback(data);
      ipcRenderer.on('job:failed', handler);
      return () => ipcRenderer.removeListener('job:failed', handler);
    },
    updateAvailable: (callback: (info: { version: string }) => void) => {
      const handler = (_: unknown, info: { version: string }) => callback(info);
      ipcRenderer.on('update:available', handler);
      return () => ipcRenderer.removeListener('update:available', handler);
    },
    updateDownloaded: (callback: (info: { version: string }) => void) => {
      const handler = (_: unknown, info: { version: string }) => callback(info);
      ipcRenderer.on('update:downloaded', handler);
      return () => ipcRenderer.removeListener('update:downloaded', handler);
    },
  },
};

// Use `contextBridge` APIs to expose Electron APIs to renderer
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI);
  contextBridge.exposeInMainWorld('api', api);
} else {
  // @ts-ignore (for older electron versions)
  window.electron = electronAPI;
  // @ts-ignore
  window.api = api;
}

// TypeScript declarations
export type ElectronAPI = typeof api;

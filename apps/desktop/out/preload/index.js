"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  // ============ FILE OPERATIONS ============
  files: {
    scan: (path) => electron.ipcRenderer.invoke("files:scan", path),
    classify: (path) => electron.ipcRenderer.invoke("files:classify", path),
    organize: (sourcePath, targetPath) => electron.ipcRenderer.invoke("files:organize", { sourcePath, targetPath }),
    undo: (options) => electron.ipcRenderer.invoke("files:undo", options),
    validatePath: (path) => electron.ipcRenderer.invoke("files:validate-path", path),
    getUndoable: (since) => electron.ipcRenderer.invoke("files:undoable", since)
  },
  // ============ HISTORY ============
  history: {
    getAllFiles: () => electron.ipcRenderer.invoke("history:files"),
    getFileById: (id) => electron.ipcRenderer.invoke("history:file", id),
    getOperations: (limit) => electron.ipcRenderer.invoke("history:operations", limit)
  },
  // ============ DUPLICATES ============
  duplicates: {
    getAll: () => electron.ipcRenderer.invoke("duplicates:list"),
    scan: (sourcePath) => electron.ipcRenderer.invoke("duplicates:scan", sourcePath),
    getByFileId: (fileId) => electron.ipcRenderer.invoke("duplicates:file", fileId)
  },
  // ============ JOBS ============
  jobs: {
    get: (id) => electron.ipcRenderer.invoke("jobs:get", id),
    listOrganize: () => electron.ipcRenderer.invoke("jobs:organize:list"),
    listDuplicate: () => electron.ipcRenderer.invoke("jobs:duplicate:list"),
    cancel: (id) => electron.ipcRenderer.invoke("jobs:cancel", id),
    getLogs: (id) => electron.ipcRenderer.invoke("jobs:logs", id)
  },
  // ============ SCHEDULES ============
  schedules: {
    list: () => electron.ipcRenderer.invoke("schedules:list"),
    start: (name) => electron.ipcRenderer.invoke("schedules:start", name),
    stop: (name) => electron.ipcRenderer.invoke("schedules:stop", name),
    trigger: (name) => electron.ipcRenderer.invoke("schedules:trigger", name)
  },
  // ============ NATIVE DIALOGS ============
  dialog: {
    selectDirectory: () => electron.ipcRenderer.invoke("dialog:select-directory"),
    selectFile: (filters) => electron.ipcRenderer.invoke("dialog:select-file", filters),
    showMessage: (options) => electron.ipcRenderer.invoke("dialog:show-message", options),
    confirm: (message, title) => electron.ipcRenderer.invoke("dialog:confirm", { message, title })
  },
  // ============ APP INFO ============
  app: {
    getVersion: () => electron.ipcRenderer.invoke("app:version"),
    getPlatform: () => electron.ipcRenderer.invoke("app:platform"),
    getUserDataPath: () => electron.ipcRenderer.invoke("app:userData")
  },
  // ============ EVENT LISTENERS ============
  on: {
    jobProgress: (callback) => {
      const handler = (_, data) => callback(data);
      electron.ipcRenderer.on("job:progress", handler);
      return () => electron.ipcRenderer.removeListener("job:progress", handler);
    },
    jobCompleted: (callback) => {
      const handler = (_, data) => callback(data);
      electron.ipcRenderer.on("job:completed", handler);
      return () => electron.ipcRenderer.removeListener("job:completed", handler);
    },
    jobFailed: (callback) => {
      const handler = (_, data) => callback(data);
      electron.ipcRenderer.on("job:failed", handler);
      return () => electron.ipcRenderer.removeListener("job:failed", handler);
    },
    updateAvailable: (callback) => {
      const handler = (_, info) => callback(info);
      electron.ipcRenderer.on("update:available", handler);
      return () => electron.ipcRenderer.removeListener("update:available", handler);
    },
    updateDownloaded: (callback) => {
      const handler = (_, info) => callback(info);
      electron.ipcRenderer.on("update:downloaded", handler);
      return () => electron.ipcRenderer.removeListener("update:downloaded", handler);
    }
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error("Failed to expose APIs:", error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}

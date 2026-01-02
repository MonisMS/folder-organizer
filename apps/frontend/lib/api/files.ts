import { apiClient } from './client';
import type { FileInfo, ScanResult } from '@file-manager/shared';

// Check if we're running in Electron (desktop app) - must check at runtime
const getElectronFilesAPI = () => {
  if (typeof window !== 'undefined') {
    const api = (window as any).api?.files;
    if (api) {
      console.log('[Files API] ✅ Electron API detected');
      return api;
    }
  }
  return null;
};

const getElectronHistoryAPI = () => {
  if (typeof window !== 'undefined') {
    const api = (window as any).api?.history;
    if (api) {
      return api;
    }
  }
  return null;
};

// Scan endpoint
export const scanFiles = async (path: string, extension?: string, sortBy?: string) => {
  const electronAPI = getElectronFilesAPI();
  if (electronAPI) {
    console.log('[Files API] Using Electron IPC for scanFiles:', path);
    const result = await electronAPI.scan(path);
    console.log('[Files API] scanFiles result:', result);
    return result;
  }
  const response = await apiClient.get<ScanResult>('/scan', {
    params: { path, extension, sortBy },
  });
  return response.data;
};

// Classify files
export const classifyFiles = async (path: string) => {
  const electronAPI = getElectronFilesAPI();
  if (electronAPI) {
    console.log('[Files API] Using Electron IPC for classifyFiles:', path);
    const result = await electronAPI.classify(path);
    return result;
  }
  const response = await apiClient.get('/api/files/classify', {
    params: { path },
  });
  return response.data;
};

// Organize files
export const organizeFiles = async (sourcePath: string, targetPath: string) => {
  const electronAPI = getElectronFilesAPI();
  if (electronAPI) {
    console.log('[Files API] Using Electron IPC for organizeFiles:', sourcePath, targetPath);
    const result = await electronAPI.organize(sourcePath, targetPath);
    console.log('[Files API] organizeFiles result:', result);
    return result;
  }
  const response = await apiClient.post('/api/files/organize', {
    sourcePath,
    targetPath,
  });
  return response.data;
};

// Validate path
export const validatePath = async (path: string) => {
  const electronAPI = getElectronFilesAPI();
  if (electronAPI) {
    const result = await electronAPI.validatePath(path);
    return result;
  }
  const response = await apiClient.post('/api/files/validate-path', { path });
  return response.data;
};

// Get all files
export const getAllFiles = async (): Promise<FileInfo[]> => {
  const electronAPI = getElectronHistoryAPI();
  if (electronAPI) {
    console.log('[Files API] Using Electron IPC for getAllFiles');
    const result = await electronAPI.getAllFiles();
    return result.files || result || [];
  }
  const response = await apiClient.get<FileInfo[]>('/api/history/files');
  return response.data;
};

// Get file by ID
export const getFileById = async (id: number) => {
  const electronAPI = getElectronHistoryAPI();
  if (electronAPI) {
    const result = await electronAPI.getFileById(id);
    return result.file || result;
  }
  const response = await apiClient.get(`/api/history/files/${id}`);
  return response.data;
};

// Get recent operations
export const getRecentOperations = async (limit = 10) => {
  const electronAPI = getElectronHistoryAPI();
  if (electronAPI) {
    console.log('[Files API] Using Electron IPC for getRecentOperations');
    const result = await electronAPI.getOperations(limit);
    return result.operations || result;
  }
  const response = await apiClient.get('/api/history/operations', {
    params: { limit },
  });
  return response.data;
};

// Undo organization
export interface UndoResult {
  success: boolean;
  message: string;
  undoneCount: number;
  skippedCount?: number;
  failedCount: number;
  errors: string[];
}

export const undoOrganization = async (options?: { since?: string; fileId?: number }) => {
  const electronAPI = getElectronFilesAPI();
  if (electronAPI) {
    console.log('[Files API] Using Electron IPC for undoOrganization');
    const result = await electronAPI.undo(options);
    return result;
  }
  const response = await apiClient.post<UndoResult>('/api/files/undo', options || {});
  return response.data;
};

// Get files that can be undone
export interface UndoableFile {
  id: number;
  name: string;
  originalPath: string;
  currentPath: string;
  category: string;
  organizedAt: string;
}

export const getUndoableFiles = async (since?: string) => {
  const electronAPI = getElectronFilesAPI();
  if (electronAPI) {
    console.log('[Files API] Using Electron IPC for getUndoableFiles');
    const result = await electronAPI.getUndoable(since);
    return result;
  }
  const response = await apiClient.get<{ files: UndoableFile[]; count: number }>('/api/files/undoable', {
    params: since ? { since } : {},
  });
  return response.data;
};
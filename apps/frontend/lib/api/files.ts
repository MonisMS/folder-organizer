import { apiClient } from './client';
import type { FileInfo, ScanResult } from '@file-manager/shared';

// Check if we're running in Electron (desktop app) - must check at runtime
const getElectronFilesAPI = () => {
  if (typeof window !== 'undefined') {
    const api = (window as unknown as { api?: { files?: unknown } }).api?.files;
    if (api) {
      return api;
    }
  }
  return null;
};

const getElectronHistoryAPI = () => {
  if (typeof window !== 'undefined') {
    const api = (window as unknown as { api?: { history?: unknown } }).api?.history;
    if (api) {
      return api;
    }
  }
  return null;
};

// Scan endpoint
export const scanFiles = async (path: string, extension?: string, sortBy?: string) => {
  const electronAPI = getElectronFilesAPI() as { scan: (path: string) => Promise<ScanResult> } | null;
  if (electronAPI) {
    const result = await electronAPI.scan(path);
    return result;
  }
  const response = await apiClient.get<ScanResult>('/scan', {
    params: { path, extension, sortBy },
  });
  return response.data;
};

// Classify files
export const classifyFiles = async (path: string) => {
  const electronAPI = getElectronFilesAPI() as { classify: (path: string) => Promise<unknown> } | null;
  if (electronAPI) {
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
  const electronAPI = getElectronFilesAPI() as { organize: (src: string, target: string) => Promise<unknown> } | null;
  if (electronAPI) {
    const result = await electronAPI.organize(sourcePath, targetPath);
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
  const electronAPI = getElectronFilesAPI() as { validatePath: (path: string) => Promise<unknown> } | null;
  if (electronAPI) {
    const result = await electronAPI.validatePath(path);
    return result;
  }
  const response = await apiClient.post('/api/files/validate-path', { path });
  return response.data;
};

// Get all files
export const getAllFiles = async (): Promise<FileInfo[]> => {
  const electronAPI = getElectronHistoryAPI() as { getAllFiles: () => Promise<{ files?: FileInfo[] }> } | null;
  if (electronAPI) {
    const result = await electronAPI.getAllFiles();
    return result.files || [];
  }
  const response = await apiClient.get<FileInfo[]>('/api/history/files');
  return response.data;
};

// Get file by ID
export const getFileById = async (id: number) => {
  const electronAPI = getElectronHistoryAPI() as { getFileById: (id: number) => Promise<{ file?: unknown }> } | null;
  if (electronAPI) {
    const result = await electronAPI.getFileById(id);
    return result.file || result;
  }
  const response = await apiClient.get(`/api/history/files/${id}`);
  return response.data;
};

// Get recent operations
export const getRecentOperations = async (limit = 10) => {
  const electronAPI = getElectronHistoryAPI() as { getOperations: (limit: number) => Promise<{ operations?: unknown }> } | null;
  if (electronAPI) {
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
  const electronAPI = getElectronFilesAPI() as { undo: (opts?: { since?: string; fileId?: number }) => Promise<UndoResult> } | null;
  if (electronAPI) {
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
  const electronAPI = getElectronFilesAPI() as { getUndoable: (since?: string) => Promise<{ files: UndoableFile[]; count: number }> } | null;
  if (electronAPI) {
    const result = await electronAPI.getUndoable(since);
    return result;
  }
  const response = await apiClient.get<{ files: UndoableFile[]; count: number }>('/api/files/undoable', {
    params: since ? { since } : {},
  });
  return response.data;
};
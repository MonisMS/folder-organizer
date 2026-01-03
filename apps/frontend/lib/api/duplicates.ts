import { apiClient } from './client';
import type { FileInfo } from '@file-manager/shared';

// Electron API interface for type safety
interface ElectronDuplicatesAPI {
  getAll: () => Promise<{ duplicates: DuplicateGroup[] }>;
  scan: (sourcePath: string) => Promise<unknown>;
  getByFileId: (fileId: number) => Promise<unknown>;
  delete: (filePath: string) => Promise<unknown>;
}

// Check if we're running in Electron (desktop app) - must check at runtime
const getElectronAPI = (): ElectronDuplicatesAPI | null => {
  if (typeof window !== 'undefined') {
    const api = (window as { api?: { duplicates?: ElectronDuplicatesAPI } }).api?.duplicates;
    if (api) {
      return api;
    }
  }
  return null;
};

export interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
  count: number;
}

export const getAllDuplicates = async () => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const result = await electronAPI.getAll();
    return result.duplicates || [];
  }
  const response = await apiClient.get<{ success: boolean; duplicates: DuplicateGroup[] }>('/api/duplicates');
  return response.data.duplicates;
};

export const scanForDuplicates = async (sourcePath: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const result = await electronAPI.scan(sourcePath);
    return result;
  }
  const response = await apiClient.post('/api/duplicates/scan', {
    sourcePath,
  });
  return response.data;
};

export const getFileDuplicates = async (fileId: number) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const result = await electronAPI.getByFileId(fileId);
    return result;
  }
  const response = await apiClient.get(`/api/duplicates/file/${fileId}`);
  return response.data;
};

export const deleteDuplicateFile = async (filePath: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const result = await electronAPI.delete(filePath);
    return result;
  }
  const response = await apiClient.delete('/api/duplicates/file', {
    data: { filePath },
  });
  return response.data;
};
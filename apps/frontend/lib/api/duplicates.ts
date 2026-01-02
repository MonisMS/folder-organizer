import { apiClient } from './client';
import type { FileInfo } from '@file-manager/shared';

// Check if we're running in Electron (desktop app) - must check at runtime
const getElectronAPI = () => {
  if (typeof window !== 'undefined') {
    const api = (window as any).api?.duplicates;
    if (api) {
      console.log('[Duplicates API] ✅ Electron API detected');
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
    console.log('[Duplicates API] Using Electron IPC for getAllDuplicates');
    const result = await electronAPI.getAll();
    console.log('[Duplicates API] getAllDuplicates result:', result);
    return result.duplicates || [];
  }
  const response = await apiClient.get<{ success: boolean; duplicates: DuplicateGroup[] }>('/api/duplicates');
  return response.data.duplicates;
};

export const scanForDuplicates = async (sourcePath: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    console.log('[Duplicates API] Using Electron IPC for scanForDuplicates:', sourcePath);
    const result = await electronAPI.scan(sourcePath);
    console.log('[Duplicates API] scanForDuplicates result:', result);
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
    console.log('[Duplicates API] Using Electron IPC for getFileDuplicates:', fileId);
    const result = await electronAPI.getByFileId(fileId);
    console.log('[Duplicates API] getFileDuplicates result:', result);
    return result;
  }
  const response = await apiClient.get(`/api/duplicates/file/${fileId}`);
  return response.data;
};

export const deleteDuplicateFile = async (filePath: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    console.log('[Duplicates API] Using Electron IPC for deleteDuplicateFile:', filePath);
    const result = await electronAPI.delete(filePath);
    console.log('[Duplicates API] deleteDuplicateFile result:', result);
    return result;
  }
  const response = await apiClient.delete('/api/duplicates/file', {
    data: { filePath },
  });
  return response.data;
};
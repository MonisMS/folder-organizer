import { apiClient } from './client';
import type { FileInfo } from '@file-manager/shared';

export interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
  count: number;
}

export const getAllDuplicates = async () => {
  const response = await apiClient.get<{ success: boolean; duplicates: DuplicateGroup[] }>('/api/duplicates');
  return response.data.duplicates;
};

export const scanForDuplicates = async (sourcePath: string) => {
  const response = await apiClient.post('/api/duplicates/scan', {
    sourcePath,
  });
  return response.data;
};

export const getFileDuplicates = async (fileId: number) => {
  const response = await apiClient.get(`/api/duplicates/file/${fileId}`);
  return response.data;
};
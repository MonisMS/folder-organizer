import { apiClient } from './client';
import type { FileInfo, ScanResult } from '@file-manager/shared';

// Scan endpoint
export const scanFiles = async (path: string, extension?: string, sortBy?: string) => {
  const response = await apiClient.get<ScanResult>('/scan', {
    params: { path, extension, sortBy },
  });
  return response.data;
};

// Classify files
export const classifyFiles = async (path: string) => {
  const response = await apiClient.get('/api/files/classify', {
    params: { path },
  });
  return response.data;
};

// Organize files
export const organizeFiles = async (sourcePath: string, targetPath: string) => {
  const response = await apiClient.post('/api/files/organize', {
    sourcePath,
    targetPath,
  });
  return response.data;
};

// Get all files
export const getAllFiles = async () => {
  const response = await apiClient.get<FileInfo[]>('/api/history/files');
  return response.data;
};

// Get file by ID
export const getFileById = async (id: number) => {
  const response = await apiClient.get(`/api/history/files/${id}`);
  return response.data;
};

// Get recent operations
export const getRecentOperations = async (limit = 10) => {
  const response = await apiClient.get('/api/history/operations', {
    params: { limit },
  });
  return response.data;
};
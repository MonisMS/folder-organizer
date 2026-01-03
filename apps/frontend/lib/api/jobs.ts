import { apiClient } from './client';

// Check if we're running in Electron (desktop app) - must check at runtime
const getElectronAPI = () => {
  if (typeof window !== 'undefined') {
    const api = (window as unknown as { api?: { jobs?: unknown } }).api?.jobs;
    if (api) {
      return api;
    }
  }
  return null;
};

export interface JobStatus {
  id: string;
  name: string;
  queue: string;
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  data: Record<string, unknown>;
  result?: Record<string, unknown>;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  attemptsMade: number;
  timestamp?: number;
}

export interface JobLogsResponse {
  success: boolean;
  jobId: string;
  queue: string;
  logs: string[];
  count: number;
}

export const getJobStatus = async (jobId: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const result = await (electronAPI as { get: (id: string) => Promise<{ success: boolean; error?: string; job: JobStatus }> }).get(jobId);
    if (!result.success) throw new Error(result.error || 'Job not found');
    return result.job;
  }
  const response = await apiClient.get<{ success: boolean; job: JobStatus }>(`/api/jobs/${jobId}`);
  return response.data.job;
};

export const getJobLogs = async (jobId: string): Promise<string[]> => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const logs = await (electronAPI as { getLogs: (id: string) => Promise<string[]> }).getLogs(jobId);
    return logs || [];
  }
  const response = await apiClient.get<JobLogsResponse>(`/api/jobs/${jobId}/logs`);
  return response.data.logs || [];
};

export const cancelJob = async (jobId: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const result = await (electronAPI as { cancel: (id: string) => Promise<{ success: boolean; error?: string }> }).cancel(jobId);
    if (!result.success) throw new Error(result.error || 'Failed to cancel job');
    return result;
  }
  
  try {
    const response = await apiClient.delete(`/api/jobs/${jobId}`);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; code?: string };
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    if (err.code === 'ERR_NETWORK') {
      throw new Error('Cannot reach job server - ensure backend is running');
    }
    throw error;
  }
};

export const listOrganizeJobs = async () => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const result = await (electronAPI as { listOrganize: () => Promise<unknown> }).listOrganize();
    return result;
  }
  const response = await apiClient.get('/api/jobs/organize/list');
  return response.data;
};

export const listDuplicateJobs = async () => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const result = await (electronAPI as { listDuplicate: () => Promise<unknown> }).listDuplicate();
    return result;
  }
  const response = await apiClient.get('/api/jobs/duplicates/list');
  return response.data;
};
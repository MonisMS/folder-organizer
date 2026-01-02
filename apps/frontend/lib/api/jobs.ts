import { apiClient } from './client';

// Check if we're running in Electron (desktop app) - must check at runtime
const getElectronAPI = () => {
  if (typeof window !== 'undefined') {
    const api = (window as any).api?.jobs;
    if (api) {
      console.log('[Jobs API] ✅ Electron API detected, window.api.jobs is available');
      return api;
    } else {
      console.log('[Jobs API] ⚠️ window.api.jobs NOT available. window.api =', (window as any).api);
      console.log('[Jobs API] Available window keys:', Object.keys(window).filter(k => k.includes('api') || k.includes('electron')));
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
  data: any;
  result?: any;
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
    console.log('[Jobs API] Using Electron IPC for getJobStatus:', jobId);
    const result = await electronAPI.get(jobId);
    if (!result.success) throw new Error(result.error || 'Job not found');
    return result.job;
  }
  const response = await apiClient.get<{ success: boolean; job: JobStatus }>(`/api/jobs/${jobId}`);
  return response.data.job;
};

export const getJobLogs = async (jobId: string): Promise<string[]> => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    console.log('[Jobs API] Using Electron IPC for getJobLogs:', jobId);
    const logs = await electronAPI.getLogs(jobId);
    return logs || [];
  }
  const response = await apiClient.get<JobLogsResponse>(`/api/jobs/${jobId}/logs`);
  return response.data.logs || [];
};

export const cancelJob = async (jobId: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    console.log('[Jobs API] Using Electron IPC for cancelJob:', jobId);
    const result = await electronAPI.cancel(jobId);
    if (!result.success) throw new Error(result.error || 'Failed to cancel job');
    return result;
  }
  
  try {
    const response = await apiClient.delete(`/api/jobs/${jobId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot reach job server - ensure backend is running');
    }
    throw error;
  }
};

export const listOrganizeJobs = async () => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    console.log('[Jobs API] Using Electron IPC for listOrganizeJobs');
    const result = await electronAPI.listOrganize();
    console.log('[Jobs API] listOrganize result:', result);
    return result;
  }
  const response = await apiClient.get('/api/jobs/organize/list');
  return response.data;
};

export const listDuplicateJobs = async () => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    console.log('[Jobs API] Using Electron IPC for listDuplicateJobs');
    const result = await electronAPI.listDuplicate();
    console.log('[Jobs API] listDuplicate result:', result);
    return result;
  }
  const response = await apiClient.get('/api/jobs/duplicates/list');
  return response.data;
};
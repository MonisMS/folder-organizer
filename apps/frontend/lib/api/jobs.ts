import { apiClient } from './client';

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
}

export const getJobStatus = async (jobId: string) => {
  const response = await apiClient.get<{ success: boolean; job: JobStatus }>(`/api/jobs/${jobId}`);
  return response.data.job;
};

export const cancelJob = async (jobId: string) => {
  const response = await apiClient.delete(`/api/jobs/${jobId}`);
  return response.data;
};

export const listOrganizeJobs = async () => {
  const response = await apiClient.get('/api/jobs/organize/list');
  return response.data;
};

export const listDuplicateJobs = async () => {
  const response = await apiClient.get('/api/jobs/duplicates/list');
  return response.data;
};
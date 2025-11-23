import { apiClient } from './client';

export interface Schedule {
  name: string;
  pattern: string;
  enabled: boolean;
  running: boolean;
  timezone: string;
  nextRun?: Date;
}

export interface ScheduleConfig {
  sourcePath?: string;
  targetPath?: string;
  daysToKeep?: number;
}

export const getSchedules = async () => {
  const response = await apiClient.get<{ success: boolean; schedules: Schedule[] }>('/api/schedules');
  return response.data.schedules;
};

export const startSchedule = async (name: string) => {
  const response = await apiClient.post(`/api/schedules/${name}/start`);
  return response.data;
};

export const stopSchedule = async (name: string) => {
  const response = await apiClient.post(`/api/schedules/${name}/stop`);
  return response.data;
};

export const triggerSchedule = async (name: string) => {
  const response = await apiClient.post(`/api/schedules/${name}/trigger`);
  return response.data;
};

export const startAllSchedules = async () => {
  const response = await apiClient.post('/api/schedules/start-all');
  return response.data;
};

export const stopAllSchedules = async () => {
  const response = await apiClient.post('/api/schedules/stop-all');
  return response.data;
};


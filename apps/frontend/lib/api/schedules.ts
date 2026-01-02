import { apiClient } from './client';

// Check if we're running in Electron (desktop app) - must check at runtime
const getElectronAPI = () => {
  if (typeof window !== 'undefined') {
    const api = (window as any).api?.schedules;
    if (api) {
      return api;
    }
  }
  return null;
};

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
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    console.log('[Schedules API] Using Electron IPC for getSchedules');
    const result = await electronAPI.list();
    return result.schedules || result;
  }
  const response = await apiClient.get<{ success: boolean; schedules: Schedule[] }>('/api/schedules');
  return response.data.schedules;
};

export const startSchedule = async (name: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    return await electronAPI.start(name);
  }
  const response = await apiClient.post(`/api/schedules/${name}/start`);
  return response.data;
};

export const stopSchedule = async (name: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    return await electronAPI.stop(name);
  }
  const response = await apiClient.post(`/api/schedules/${name}/stop`);
  return response.data;
};

export const triggerSchedule = async (name: string) => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    return await electronAPI.trigger(name);
  }
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


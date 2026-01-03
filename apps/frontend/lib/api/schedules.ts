import { apiClient } from './client';

// Electron API type for schedules
interface ElectronSchedulesAPI {
  list: () => Promise<{ schedules?: Schedule[] } | Schedule[]>;
  start: (name: string) => Promise<unknown>;
  stop: (name: string) => Promise<unknown>;
  trigger: (name: string) => Promise<unknown>;
}

// Check if we're running in Electron (desktop app) - must check at runtime
const getElectronAPI = (): ElectronSchedulesAPI | null => {
  if (typeof window !== 'undefined') {
    const api = (window as unknown as { api?: { schedules?: ElectronSchedulesAPI } }).api?.schedules;
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

export const getSchedules = async (): Promise<Schedule[]> => {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    const result = await electronAPI.list();
    // Handle both { schedules: [...] } and [...] response formats
    if (Array.isArray(result)) {
      return result;
    }
    return result.schedules || [];
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


import { ipcMain } from 'electron';
import log from 'electron-log';
import {
  getScheduleStatus,
  startSchedule,
  stopSchedule,
  triggerSchedule,
} from '../services/scheduleManager';
import { schedules, type ScheduleName } from '../config/schedules';

export function registerScheduleHandlers(): void {
  // List all schedules
  ipcMain.handle('schedules:list', async () => {
    try {
      const status = getScheduleStatus();
      return {
        success: true,
        count: status.length,
        schedules: status,
      };
    } catch (error) {
      log.error('Failed to get schedules:', error);
      throw error;
    }
  });

  // Start a schedule
  ipcMain.handle('schedules:start', async (_, name: string) => {
    try {
      if (!(name in schedules)) {
        return { success: false, error: 'Schedule not found' };
      }

      const started = startSchedule(name as ScheduleName);
      
      if (!started) {
        return { success: false, error: 'Schedule already running or disabled' };
      }

      return { success: true, message: `Schedule '${name}' started` };
    } catch (error) {
      log.error('Failed to start schedule:', error);
      throw error;
    }
  });

  // Stop a schedule
  ipcMain.handle('schedules:stop', async (_, name: string) => {
    try {
      if (!(name in schedules)) {
        return { success: false, error: 'Schedule not found' };
      }

      const stopped = stopSchedule(name as ScheduleName);
      
      if (!stopped) {
        return { success: false, error: 'Schedule not running' };
      }

      return { success: true, message: `Schedule '${name}' stopped` };
    } catch (error) {
      log.error('Failed to stop schedule:', error);
      throw error;
    }
  });

  // Trigger a schedule manually
  ipcMain.handle('schedules:trigger', async (_, name: string) => {
    try {
      if (!(name in schedules)) {
        return { success: false, error: 'Schedule not found' };
      }

      await triggerSchedule(name as ScheduleName);
      return { success: true, message: `Schedule '${name}' triggered` };
    } catch (error) {
      log.error('Failed to trigger schedule:', error);
      throw error;
    }
  });
}

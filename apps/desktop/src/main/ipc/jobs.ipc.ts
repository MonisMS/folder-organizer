import { ipcMain } from 'electron';
import log from 'electron-log';
import { getJob, getJobsByType, cancelJob } from '../queue/jobQueue';

export function registerJobHandlers(): void {
  log.info('📋 Registering job IPC handlers...');
  
  // Get job by ID
  ipcMain.handle('jobs:get', async (_, id: string) => {
    log.info(`[IPC] jobs:get called with id: ${id}`);
    try {
      const job = await getJob(id);
      
      if (!job) {
        log.warn(`[IPC] Job not found: ${id}`);
        return { success: false, error: 'Job not found' };
      }

      const getTimestamp = (date: Date | unknown): number | undefined => {
        if (!date) return undefined;
        if (date instanceof Date) return date.getTime();
        return new Date(date as string | number).getTime();
      };

      const result = {
        success: true,
        job: {
          id: job.id,
          name: job.type === 'organize' ? 'File Organization' : 'Duplicate Scan',
          queue: job.type,
          state: job.status,
          progress: job.progress,
          data: job.data,
          result: job.result,
          processedOn: getTimestamp(job.startedAt),
          finishedOn: getTimestamp(job.completedAt),
          failedReason: job.error,
          timestamp: getTimestamp(job.createdAt),
        },
      };
      log.info(`[IPC] jobs:get returning:`, JSON.stringify(result));
      return result;
    } catch (error) {
      log.error('[IPC] jobs:get failed:', error);
      throw error;
    }
  });

  // List organize jobs
  ipcMain.handle('jobs:organize:list', async () => {
    log.info('[IPC] jobs:organize:list called');
    try {
      const jobs = await getJobsByType('organize');
      log.info(`[IPC] Found ${jobs.length} organize jobs`);
      
      const result = {
        success: true,
        count: jobs.length,
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.type === 'organize' ? 'File Organization' : 'Duplicate Scan',
          state: job.status,
          progress: job.progress,
          data: job.data,
          result: job.result,
          timestamp: job.createdAt instanceof Date ? job.createdAt.getTime() : new Date(job.createdAt).getTime(),
          processedOn: job.startedAt ? (job.startedAt instanceof Date ? job.startedAt.getTime() : new Date(job.startedAt).getTime()) : undefined,
          finishedOn: job.completedAt ? (job.completedAt instanceof Date ? job.completedAt.getTime() : new Date(job.completedAt).getTime()) : undefined,
          failedReason: job.error,
        })),
      };
      log.info(`[IPC] jobs:organize:list returning ${result.jobs.length} jobs`);
      return result;
    } catch (error) {
      log.error('[IPC] jobs:organize:list failed:', error);
      throw error;
    }
  });

  // List duplicate jobs
  ipcMain.handle('jobs:duplicate:list', async () => {
    log.info('[IPC] jobs:duplicate:list called');
    try {
      const jobs = await getJobsByType('duplicate');
      log.info(`[IPC] Found ${jobs.length} duplicate jobs`);
      
      const result = {
        success: true,
        count: jobs.length,
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.type === 'duplicate' ? 'Duplicate Scan' : 'File Organization',
          state: job.status,
          progress: job.progress,
          data: job.data,
          result: job.result,
          timestamp: job.createdAt instanceof Date ? job.createdAt.getTime() : new Date(job.createdAt).getTime(),
          processedOn: job.startedAt ? (job.startedAt instanceof Date ? job.startedAt.getTime() : new Date(job.startedAt).getTime()) : undefined,
          finishedOn: job.completedAt ? (job.completedAt instanceof Date ? job.completedAt.getTime() : new Date(job.completedAt).getTime()) : undefined,
          failedReason: job.error,
        })),
      };
      log.info(`[IPC] jobs:duplicate:list returning ${result.jobs.length} jobs`);
      return result;
    } catch (error) {
      log.error('[IPC] jobs:duplicate:list failed:', error);
      throw error;
    }
  });

  // Cancel job
  ipcMain.handle('jobs:cancel', async (_, id: string) => {
    try {
      const cancelled = await cancelJob(id);
      if (cancelled) {
        return { success: true, message: 'Job cancellation initiated' };
      } else {
        return { success: false, error: 'Job cannot be cancelled in current state' };
      }
    } catch (error) {
      log.error('Failed to cancel job:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get job logs
  ipcMain.handle('jobs:logs', async (_, id: string) => {
    try {
      const job = await getJob(id);
      return job ? job.logs : [];
    } catch (error) {
      log.error('Failed to get job logs:', error);
      throw error;
    }
  });
}

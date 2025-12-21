import { ipcMain } from 'electron';
import log from 'electron-log';
import { getJob, getJobsByType, cancelJob } from '../queue/jobQueue';

export function registerJobHandlers(): void {
  // Get job by ID
  ipcMain.handle('jobs:get', async (_, id: string) => {
    try {
      const job = await getJob(id);
      
      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      return {
        success: true,
        job: {
          id: job.id,
          name: job.type,
          queue: job.type,
          state: job.status,
          progress: job.progress,
          data: job.data,
          result: job.result,
          processedOn: job.startedAt?.getTime(),
          finishedOn: job.completedAt?.getTime(),
          failedReason: job.error,
          timestamp: job.createdAt.getTime(),
        },
      };
    } catch (error) {
      log.error('Failed to get job:', error);
      throw error;
    }
  });

  // List organize jobs
  ipcMain.handle('jobs:organize:list', async () => {
    try {
      const jobs = await getJobsByType('organize');
      
      return {
        success: true,
        count: jobs.length,
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.type,
          state: job.status,
          progress: job.progress,
          data: job.data,
          result: job.result,
          timestamp: job.createdAt.getTime(),
          processedOn: job.startedAt?.getTime(),
          finishedOn: job.completedAt?.getTime(),
          failedReason: job.error,
        })),
      };
    } catch (error) {
      log.error('Failed to list organize jobs:', error);
      throw error;
    }
  });

  // List duplicate jobs
  ipcMain.handle('jobs:duplicate:list', async () => {
    try {
      const jobs = await getJobsByType('duplicate');
      
      return {
        success: true,
        count: jobs.length,
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.type,
          state: job.status,
          progress: job.progress,
          data: job.data,
          result: job.result,
          timestamp: job.createdAt.getTime(),
          processedOn: job.startedAt?.getTime(),
          finishedOn: job.completedAt?.getTime(),
          failedReason: job.error,
        })),
      };
    } catch (error) {
      log.error('Failed to list duplicate jobs:', error);
      throw error;
    }
  });

  // Cancel job
  ipcMain.handle('jobs:cancel', async (_, id: string) => {
    try {
      const cancelled = await cancelJob(id);
      return { success: cancelled };
    } catch (error) {
      log.error('Failed to cancel job:', error);
      throw error;
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

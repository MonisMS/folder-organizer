import { ipcMain } from 'electron';
import log from 'electron-log';
import { createJob } from '../queue/jobQueue';
import { fileController } from '../controller/fileController';

export function registerDuplicateHandlers(): void {
  // Get all duplicates from database
  ipcMain.handle('duplicates:list', async () => {
    try {
      const duplicates = await fileController.getAllDuplicates();
      log.info(`[IPC] duplicates:list returning ${duplicates.length} groups`);
      return {
        success: true,
        count: duplicates.length,
        duplicates,
      };
    } catch (error) {
      log.error('Failed to get duplicates:', error);
      throw error;
    }
  });

  // Scan for duplicates (create job)
  ipcMain.handle('duplicates:scan', async (_, sourcePath: string) => {
    try {
      log.info(`[IPC] Starting duplicate scan for: ${sourcePath}`);
      const job = await createJob('duplicate', { sourcePath });
      return {
        success: true,
        jobId: job.id,
        status: 'queued',
      };
    } catch (error) {
      log.error('Failed to create duplicate scan job:', error);
      throw error;
    }
  });

  // Delete a duplicate file
  ipcMain.handle('duplicates:delete', async (_, filePath: string) => {
    try {
      log.info(`[IPC] Deleting duplicate file: ${filePath}`);
      const result = await fileController.deleteFile(filePath);
      return result;
    } catch (error) {
      log.error('Failed to delete duplicate file:', error);
      throw error;
    }
  });

  // Find duplicates of a specific file
  ipcMain.handle('duplicates:file', async (_, fileId: number) => {
    try {
      const file = await fileController.getFileById(fileId);

      if (!file) {
        return { success: false, error: 'File not found' };
      }

      if (!file.hash) {
        return { success: false, error: 'File has no hash' };
      }

      const duplicates = await fileController.findDuplicatesByHash(file.hash);

      return {
        success: true,
        originalFile: file,
        duplicates: duplicates.filter((d) => d.id !== fileId),
        count: duplicates.length - 1,
      };
    } catch (error) {
      log.error('Failed to find file duplicates:', error);
      throw error;
    }
  });
}

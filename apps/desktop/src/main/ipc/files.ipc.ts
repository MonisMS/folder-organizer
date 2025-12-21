import { ipcMain } from 'electron';
import { access, stat } from 'fs/promises';
import { constants } from 'fs';
import log from 'electron-log';
import { scanInfo } from '../services/scannerInfo';
import { classifyFiles } from '../services/fileClassifier';
import { createJob } from '../queue/jobQueue';
import { fileController } from '../controller/fileController';

export function registerFileHandlers(): void {
  // Scan files in a directory
  ipcMain.handle('files:scan', async (_, path: string) => {
    try {
      return await scanInfo(path);
    } catch (error) {
      log.error('Failed to scan files:', error);
      throw error;
    }
  });

  // Classify files by type
  ipcMain.handle('files:classify', async (_, path: string) => {
    try {
      const scanResult = await scanInfo(path);
      const categorized = classifyFiles(scanResult.files);

      const categories: Record<string, unknown[]> = {};
      for (const [category, files] of categorized) {
        categories[category] = files;
      }

      return {
        totalFiles: scanResult.totalFiles,
        scannedPath: scanResult.scannedPath,
        scannedAt: scanResult.scannedAt,
        categories,
      };
    } catch (error) {
      log.error('Failed to classify files:', error);
      throw error;
    }
  });

  // Organize files (create job)
  ipcMain.handle('files:organize', async (_, { sourcePath, targetPath }) => {
    try {
      const job = await createJob('organize', { sourcePath, targetPath });
      return {
        success: true,
        jobId: job.id,
        status: 'queued',
      };
    } catch (error) {
      log.error('Failed to create organize job:', error);
      throw error;
    }
  });

  // Validate path
  ipcMain.handle('files:validate-path', async (_, path: string) => {
    try {
      const stats = await stat(path);
      await access(path, constants.R_OK);

      return {
        valid: true,
        exists: true,
        isDirectory: stats.isDirectory(),
        readable: true,
      };
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      return {
        valid: false,
        exists: err.code !== 'ENOENT',
        isDirectory: false,
        readable: false,
        error: err.message,
      };
    }
  });

  // Undo file organization
  ipcMain.handle('files:undo', async (_, options?: { fileId?: number; since?: string }) => {
    try {
      if (options?.fileId) {
        return await fileController.undoFileMove(options.fileId);
      }
      const since = options?.since ? new Date(options.since) : undefined;
      return await fileController.undoRecentOrganization(since ? { since } : undefined);
    } catch (error) {
      log.error('Failed to undo organization:', error);
      throw error;
    }
  });

  // Get undoable files
  ipcMain.handle('files:undoable', async (_, since?: string) => {
    try {
      const sinceDate = since ? new Date(since) : undefined;
      return await fileController.getUndoableFiles(sinceDate);
    } catch (error) {
      log.error('Failed to get undoable files:', error);
      throw error;
    }
  });
}

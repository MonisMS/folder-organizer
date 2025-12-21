import { ipcMain } from 'electron';
import log from 'electron-log';
import { fileController } from '../controller/fileController';

export function registerHistoryHandlers(): void {
  // Get all files
  ipcMain.handle('history:files', async () => {
    try {
      return await fileController.getAllFiles();
    } catch (error) {
      log.error('Failed to get files:', error);
      throw error;
    }
  });

  // Get file by ID with history
  ipcMain.handle('history:file', async (_, id: number) => {
    try {
      const file = await fileController.getFileById(id);
      const history = await fileController.getFileHistory(id);
      return { file, history };
    } catch (error) {
      log.error('Failed to get file:', error);
      throw error;
    }
  });

  // Get recent operations
  ipcMain.handle('history:operations', async (_, limit?: number) => {
    try {
      return await fileController.getRecentOperations(limit || 10);
    } catch (error) {
      log.error('Failed to get operations:', error);
      throw error;
    }
  });
}

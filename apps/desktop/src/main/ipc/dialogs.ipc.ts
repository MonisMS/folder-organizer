import { ipcMain, dialog } from 'electron';

export function registerDialogHandlers(): void {
  // Select directory
  ipcMain.handle('dialog:select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Folder',
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Select file
  ipcMain.handle('dialog:select-file', async (_, filters?: { name: string; extensions: string[] }[]) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Select File',
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Show message
  ipcMain.handle('dialog:show-message', async (_, options: {
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  }) => {
    return dialog.showMessageBox({
      type: options.type,
      title: options.title,
      message: options.message,
      buttons: ['OK'],
    });
  });

  // Confirm dialog
  ipcMain.handle('dialog:confirm', async (_, options: {
    message: string;
    title?: string;
  }) => {
    const result = await dialog.showMessageBox({
      type: 'question',
      title: options.title || 'Confirm',
      message: options.message,
      buttons: ['Yes', 'No'],
      defaultId: 0,
      cancelId: 1,
    });
    return result.response === 0;
  });
}

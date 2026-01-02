// Register all IPC handlers
export { registerFileHandlers } from './files.ipc';
export { registerHistoryHandlers } from './history.ipc';
export { registerDuplicateHandlers } from './duplicates.ipc';
export { registerJobHandlers } from './jobs.ipc';
export { registerScheduleHandlers } from './schedules.ipc';
export { registerDialogHandlers } from './dialogs.ipc';

import { registerFileHandlers } from './files.ipc';
import { registerHistoryHandlers } from './history.ipc';
import { registerDuplicateHandlers } from './duplicates.ipc';
import { registerJobHandlers } from './jobs.ipc';
import { registerScheduleHandlers } from './schedules.ipc';
import { registerDialogHandlers } from './dialogs.ipc';

export function registerAllHandlers(): void {
  registerFileHandlers();
  registerHistoryHandlers();
  registerDuplicateHandlers();
  registerJobHandlers();
  registerScheduleHandlers();
  registerDialogHandlers();
}

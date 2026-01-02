import { app } from 'electron';
import { join } from 'path';

// Get platform-specific paths
const downloadsPath = app.getPath('downloads');
const documentsPath = app.getPath('documents');

export const schedules = {
  // Daily organize downloads at 2 AM
  autoOrganizeDownloads: {
    pattern: '0 2 * * *',
    enabled: false, // Disabled by default - user should configure paths
    timezone: 'UTC',
    config: {
      sourcePath: downloadsPath,
      targetPath: join(documentsPath, 'Organized Files'),
    },
  },

  // Weekly duplicate scan on Sunday at 3 AM
  weeklyDuplicateScan: {
    pattern: '0 3 * * 0',
    enabled: false,
    timezone: 'UTC',
    config: {
      sourcePath: join(documentsPath, 'Organized Files'),
    },
  },

  // Daily cleanup of old jobs at midnight
  dailyJobCleanup: {
    pattern: '0 0 * * *',
    enabled: false, // Disabled - users can manually trigger cleanup if needed
    timezone: 'UTC',
    config: {
      daysToKeep: 7,
    },
  },

  // Test schedule (every minute) - disabled
  testSchedule: {
    pattern: '* * * * *',
    enabled: false,
    timezone: 'UTC',
    config: {
      sourcePath: '',
      targetPath: '',
    },
  },
} as const;

export type ScheduleName = keyof typeof schedules;

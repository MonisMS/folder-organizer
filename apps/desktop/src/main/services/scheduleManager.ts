import cron, { ScheduledTask } from 'node-cron';
import log from 'electron-log';
import { schedules, type ScheduleName } from '../config/schedules';
import { createJob } from '../queue/jobQueue';

// Active cron tasks registry
const activeTasks = new Map<ScheduleName, ScheduledTask>();

// Schedule handlers
const scheduleHandlers: Record<ScheduleName, () => Promise<void>> = {
  autoOrganizeDownloads: async () => {
    const config = schedules.autoOrganizeDownloads.config;
    log.info({ config }, 'Running scheduled organize task');

    try {
      await createJob('organize', {
        sourcePath: config.sourcePath,
        targetPath: config.targetPath,
      });
      log.info('Scheduled organize job created');
    } catch (error) {
      log.error('Failed to create scheduled organize job:', error);
    }
  },

  weeklyDuplicateScan: async () => {
    const config = schedules.weeklyDuplicateScan.config;
    log.info({ config }, 'Running weekly duplicate scan');

    try {
      await createJob('duplicate', {
        sourcePath: config.sourcePath,
      });
      log.info('Scheduled duplicate scan created');
    } catch (error) {
      log.error('Failed to create scheduled duplicate job:', error);
    }
  },

  dailyJobCleanup: async () => {
    const config = schedules.dailyJobCleanup.config;
    log.info({ config }, 'Running daily job cleanup');
    // TODO: Implement job cleanup from SQLite
    log.info('Job cleanup completed');
  },

  testSchedule: async () => {
    log.info('Test schedule triggered');
  },
};

// Start a specific schedule
export function startSchedule(name: ScheduleName): boolean {
  const schedule = schedules[name];

  if (!schedule.enabled) {
    log.warn(`Schedule '${name}' is disabled`);
    return false;
  }

  if (activeTasks.has(name)) {
    log.warn(`Schedule '${name}' is already running`);
    return false;
  }

  const handler = scheduleHandlers[name];
  if (!handler) {
    log.error(`No handler for schedule '${name}'`);
    return false;
  }

  const task = cron.schedule(
    schedule.pattern,
    async () => {
      log.info(`⏰ Running scheduled task: ${name}`);
      try {
        await handler();
      } catch (error) {
        log.error(`Scheduled task '${name}' failed:`, error);
      }
    },
    {
      timezone: schedule.timezone,
    }
  );

  activeTasks.set(name, task);
  log.info(`✅ Schedule '${name}' started (${schedule.pattern})`);
  return true;
}

// Stop a specific schedule
export function stopSchedule(name: ScheduleName): boolean {
  const task = activeTasks.get(name);

  if (!task) {
    log.warn(`Schedule '${name}' is not running`);
    return false;
  }

  task.stop();
  activeTasks.delete(name);
  log.info(`🛑 Schedule '${name}' stopped`);
  return true;
}

// Trigger a schedule manually
export async function triggerSchedule(name: ScheduleName): Promise<void> {
  const handler = scheduleHandlers[name];

  if (!handler) {
    throw new Error(`No handler for schedule '${name}'`);
  }

  log.info(`🔄 Manually triggering schedule: ${name}`);
  await handler();
}

// Get status of all schedules
export function getScheduleStatus(): Array<{
  name: string;
  pattern: string;
  enabled: boolean;
  running: boolean;
  config: Record<string, unknown>;
}> {
  return Object.entries(schedules).map(([name, schedule]) => ({
    name,
    pattern: schedule.pattern,
    enabled: schedule.enabled,
    running: activeTasks.has(name as ScheduleName),
    config: schedule.config,
  }));
}

// Start all enabled schedules
export function startAllSchedules(): void {
  log.info('🚀 Starting all enabled schedules...');

  for (const name of Object.keys(schedules) as ScheduleName[]) {
    if (schedules[name].enabled) {
      try {
        startSchedule(name);
      } catch (error) {
        log.warn(`Failed to start schedule '${name}':`, error);
      }
    }
  }
}

// Stop all schedules
export function stopAllSchedules(): void {
  log.info('🛑 Stopping all schedules...');

  for (const [name, task] of activeTasks.entries()) {
    task.stop();
    log.info(`Stopped schedule: ${name}`);
  }

  activeTasks.clear();
}

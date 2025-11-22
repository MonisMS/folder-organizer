import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { schedules } from '../config/schedules.js';
import type { scheduleName } from '../config/schedules.js';
import { organizeQueue, duplicateCheckQueue } from '../queues/fileQueue.js';

type ScheduleName = scheduleName;

/**
 * Active cron tasks registry
 * Keeps track of running scheduled tasks
 */
const activeTasks = new Map<ScheduleName, cron.ScheduledTask>();

/**
 * Schedule handler functions
 * Define what each schedule actually does
 */
const scheduleHandlers = {
  /**
   * Auto-organize Downloads folder
   */
  autoOrganizeDownloads: async () => {
    const config = schedules.autoOrganizeDownloads.config;
    logger.info({ config }, 'Running scheduled organize task');

    try {
      const job = await organizeQueue.add(
        'scheduled-organize-downloads',
        {
          sourcePath: config.sourcePath,
          targetPath: config.targetPath,
        },
        {
          priority: 1, // High priority for scheduled jobs
          attempts: 3,
        }
      );

      logger.info(
        { jobId: job.id, sourcePath: config.sourcePath },
        'Scheduled organize job created'
      );
    } catch (error) {
      logger.error({ error, config }, 'Failed to create scheduled organize job');
    }
  },

  /**
   * Weekly duplicate scan
   */
  weeklyDuplicateScan: async () => {
    const config = schedules.weeklyDuplicateScan.config;
    logger.info({ config }, 'Running weekly duplicate scan');

    try {
      const job = await duplicateCheckQueue.add(
        'scheduled-duplicate-scan',
        {
          sourcePath: config.sourcePath,
        },
        {
          priority: 2, // Medium priority
          attempts: 2,
        }
      );

      logger.info(
        { jobId: job.id, sourcePath: config.sourcePath },
        'Scheduled duplicate scan created'
      );
    } catch (error) {
      logger.error({ error, config }, 'Failed to create scheduled duplicate job');
    }
  },

  /**
   * Daily cleanup of old completed/failed jobs
   */
  dailyJobCleanup: async () => {
    const config = schedules.dailyJobCleanup.config;
    logger.info({ config }, 'Running daily job cleanup');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.daysToKeep);

      // Clean organize queue
      await organizeQueue.clean(config.daysToKeep * 24 * 60 * 60 * 1000, 100, 'completed');
      await organizeQueue.clean(config.daysToKeep * 24 * 60 * 60 * 1000, 100, 'failed');

      // Clean duplicate queue
      await duplicateCheckQueue.clean(config.daysToKeep * 24 * 60 * 60 * 1000, 50, 'completed');
      await duplicateCheckQueue.clean(config.daysToKeep * 24 * 60 * 60 * 1000, 50, 'failed');

      logger.info(
        { daysToKeep: config.daysToKeep },
        'Job cleanup completed'
      );
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup jobs');
    }
  },

  /**
   * Test schedule for development
   */
  testSchedule: async () => {
    const config = schedules.testSchedule.config;
    logger.info({ config }, 'Running test schedule');

    try {
      const job = await organizeQueue.add(
        'test-organize',
        {
          sourcePath: config.sourcePath,
          targetPath: config.targetPath,
        }
      );

      logger.info({ jobId: job.id }, 'Test job created');
    } catch (error) {
      logger.error({ error }, 'Test job failed');
    }
  },
} as Record<ScheduleName, () => Promise<void>>;

/**
 * Start a specific scheduled task
 */
export function startSchedule(scheduleName: ScheduleName): boolean {
  const schedule = schedules[scheduleName as keyof typeof schedules];

  if (!schedule.enabled) {
    logger.warn({ scheduleName }, 'Schedule is disabled');
    return false;
  }

  if (activeTasks.has(scheduleName)) {
    logger.warn({ scheduleName }, 'Schedule already running');
    return false;
  }

  try {
    const task = cron.schedule(
      schedule.pattern,
      async () => {
        logger.info(
          { scheduleName, pattern: schedule.pattern },
          'Cron task triggered'
        );
        await scheduleHandlers[scheduleName]();
      },
      {
        timezone: schedule.timezone,
      }
    );

    activeTasks.set(scheduleName, task);

    logger.info(
      {
        scheduleName,
        pattern: schedule.pattern,
        timezone: schedule.timezone,
      },
      'Schedule started'
    );

    return true;
  } catch (error) {
    logger.error({ error, scheduleName }, 'Failed to start schedule');
    return false;
  }
}

/**
 * Stop a specific scheduled task
 */
export function stopSchedule(scheduleName: ScheduleName): boolean {
  const task = activeTasks.get(scheduleName);

  if (!task) {
    logger.warn({ scheduleName }, 'Schedule not running');
    return false;
  }

  task.stop();
  activeTasks.delete(scheduleName);

  logger.info({ scheduleName }, 'Schedule stopped');
  return true;
}

/**
 * Start all enabled schedules
 */
export function startAllSchedules(): void {
  logger.info('Starting all enabled schedules...');

  for (const scheduleName of Object.keys(schedules) as ScheduleName[]) {
    const schedule = schedules[scheduleName as keyof typeof schedules];

    if (schedule.enabled) {
      startSchedule(scheduleName);
    } else {
      logger.info({ scheduleName }, 'Schedule disabled, skipping');
    }
  }

  logger.info(
    { activeCount: activeTasks.size },
    'All enabled schedules started'
  );
}

/**
 * Stop all running schedules
 */
export function stopAllSchedules(): void {
  logger.info('Stopping all schedules...');

  for (const scheduleName of activeTasks.keys()) {
    stopSchedule(scheduleName);
  }

  logger.info('All schedules stopped');
}

/**
 * Get status of all schedules
 */
export function getScheduleStatus(): {
  name: ScheduleName;
  pattern: string;
  enabled: boolean;
  running: boolean;
  timezone: string;
  nextRun?: Date;
}[] {
  return (Object.keys(schedules) as ScheduleName[]).map((name) => {
    const schedule = schedules[name as keyof typeof schedules];
    const task = activeTasks.get(name);

    return {
      name,
      pattern: schedule.pattern,
      enabled: schedule.enabled,
      running: !!task,
      timezone: schedule.timezone,
      // node-cron doesn't provide nextRun, would need cron-parser for this
    };
  });
}

/**
 * Manually trigger a schedule (run immediately)
 */
export async function triggerSchedule(scheduleName: ScheduleName): Promise<void> {
  logger.info({ scheduleName }, 'Manually triggering schedule');

  await scheduleHandlers[scheduleName]();

  logger.info({ scheduleName }, 'Schedule triggered manually');
}
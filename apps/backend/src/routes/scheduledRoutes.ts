import type { FastifyInstance } from 'fastify';
import {
  startSchedule,
  stopSchedule,
  getScheduleStatus,
  triggerSchedule,
  startAllSchedules,
  stopAllSchedules,
} from '../services/scheduleManager.js';
import { schedules, type scheduleName,  } from '../config/schedules.js';
import { logger } from '../lib/logger.js';

export async function scheduleRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /api/schedules
   * List all schedules with their status
   */
  fastify.get('/', async (request, reply) => {
    try {
      const status = getScheduleStatus();

      return {
        success: true,
        count: status.length,
        schedules: status,
      };
    } catch (error) {
      logger.error({ error }, 'Error getting schedule status');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get schedule status',
      });
    }
  });

  /**
   * POST /api/schedules/:name/start
   * Start a specific schedule
   */
  fastify.post<{
    Params: { name: string };
  }>('/:name/start', async (request, reply) => {
    try {
      const { name } = request.params;

      if (!(name in schedules)) {
        return reply.status(404).send({
          success: false,
          error: 'Schedule not found',
        });
      }

      const started = startSchedule(name as scheduleName);

      if (!started) {
        return reply.status(400).send({
          success: false,
          error: 'Schedule already running or disabled',
        });
      }

      return {
        success: true,
        message: `Schedule '${name}' started`,
      };
    } catch (error) {
      logger.error({ error }, 'Error starting schedule');
      return reply.status(500).send({
        success: false,
        error: 'Failed to start schedule',
      });
    }
  });

  /**
   * POST /api/schedules/:name/stop
   * Stop a specific schedule
   */
  fastify.post<{
    Params: { name: string };
  }>('/:name/stop', async (request, reply) => {
    try {
      const { name } = request.params;

      if (!(name in schedules)) {
        return reply.status(404).send({
          success: false,
          error: 'Schedule not found',
        });
      }

      const stopped = stopSchedule(name as scheduleName);

      if (!stopped) {
        return reply.status(400).send({
          success: false,
          error: 'Schedule not running',
        });
      }

      return {
        success: true,
        message: `Schedule '${name}' stopped`,
      };
    } catch (error) {
      logger.error({ error }, 'Error stopping schedule');
      return reply.status(500).send({
        success: false,
        error: 'Failed to stop schedule',
      });
    }
  });

  /**
   * POST /api/schedules/:name/trigger
   * Manually trigger a schedule (run immediately)
   */
  fastify.post<{
    Params: { name: string };
  }>('/:name/trigger', async (request, reply) => {
    try {
      const { name } = request.params;

      if (!(name in schedules)) {
        return reply.status(404).send({
          success: false,
          error: 'Schedule not found',
        });
      }

      await triggerSchedule(name as scheduleName);

      return {
        success: true,
        message: `Schedule '${name}' triggered manually`,
      };
    } catch (error) {
      logger.error({ error }, 'Error triggering schedule');
      return reply.status(500).send({
        success: false,
        error: 'Failed to trigger schedule',
      });
    }
  });

  /**
   * POST /api/schedules/start-all
   * Start all enabled schedules
   */
  fastify.post('/start-all', async (request, reply) => {
    try {
      startAllSchedules();

      return {
        success: true,
        message: 'All enabled schedules started',
      };
    } catch (error) {
      logger.error({ error }, 'Error starting all schedules');
      return reply.status(500).send({
        success: false,
        error: 'Failed to start schedules',
      });
    }
  });

  /**
   * POST /api/schedules/stop-all
   * Stop all running schedules
   */
  fastify.post('/stop-all', async (request, reply) => {
    try {
      stopAllSchedules();

      return {
        success: true,
        message: 'All schedules stopped',
      };
    } catch (error) {
      logger.error({ error }, 'Error stopping all schedules');
      return reply.status(500).send({
        success: false,
        error: 'Failed to stop schedules',
      });
    }
  });
}
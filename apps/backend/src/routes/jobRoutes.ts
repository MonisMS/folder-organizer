import type { FastifyInstance } from 'fastify';
import { duplicateCheckQueue, organizeQueue } from '../queues/fileQueue.js';
import { logger } from '../lib/logger.js';

export async function jobRoutes(fastify: FastifyInstance) {
  
  // Get job status by ID
  fastify.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // Try organize queue first
      let job = await organizeQueue.getJob(id);
      let queueName = 'organize';

      // Try duplicate queue if not found
      if (!job) {
        job = await duplicateCheckQueue.getJob(id);
        queueName = 'duplicate';
      }

      if (!job) {
        return reply.status(404).send({
          success: false,
          error: 'Job not found',
        });
      }

      // Get job details
      const state = await job.getState();
      const progress = job.progress;

      return {
        success: true,
        job: {
          id: job.id,
          name: job.name,
          queue: queueName,
          state, // 'waiting' | 'active' | 'completed' | 'failed'
          progress,
          data: job.data,
          result: job.returnvalue, // Only available if completed
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching job status');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch job status',
      });
    }
  });

  // List all jobs in organize queue
  fastify.get('/organize/list', async (request, reply) => {
    try {
      const jobs = await organizeQueue.getJobs([
        'waiting', 
        'active', 
        'completed', 
        'failed'
      ]);
      
      const jobList = await Promise.all(
        jobs.map(async (job) => ({
          id: job.id,
          name: job.name,
          state: await job.getState(),
          progress: job.progress,
          data: job.data,
          result: job.returnvalue,
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
        }))
      );

      return {
        success: true,
        count: jobList.length,
        jobs: jobList,
      };
    } catch (error) {
      logger.error({ error }, 'Error listing organize jobs');
      return reply.status(500).send({
        success: false,
        error: 'Failed to list jobs',
      });
    }
  });

  // List all jobs in duplicate queue
  fastify.get('/duplicates/list', async (request, reply) => {
    try {
      const jobs = await duplicateCheckQueue.getJobs([
        'waiting', 
        'active', 
        'completed', 
        'failed'
      ]);
      
      const jobList = await Promise.all(
        jobs.map(async (job: any) => ({
          id: job.id,
          name: job.name,
          state: await job.getState(),
          progress: job.progress,
          data: job.data,
          result: job.returnvalue,
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
        }))
      );

      return {
        success: true,
        count: jobList.length,
        jobs: jobList,
      };
    } catch (error) {
      logger.error({ error }, 'Error listing duplicate jobs');
      return reply.status(500).send({
        success: false,
        error: 'Failed to list jobs',
      });
    }
  });

  // Cancel a job
  fastify.delete<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      let job = await organizeQueue.getJob(id);
      if (!job) {
        job = await duplicateCheckQueue.getJob(id);
      }

      if (!job) {
        return reply.status(404).send({
          success: false,
          error: 'Job not found',
        });
      }

      await job.remove();

      return {
        success: true,
        message: 'Job cancelled and removed',
      };
    } catch (error) {
      logger.error({ error }, 'Error cancelling job');
      return reply.status(500).send({
        success: false,
        error: 'Failed to cancel job',
      });
    }
  });

  // Get job logs
  fastify.get<{
    Params: { id: string };
  }>('/:id/logs', async (request, reply) => {
    try {
      const { id } = request.params;

      let job = await organizeQueue.getJob(id);
      let queueName = 'organize';

      if (!job) {
        job = await duplicateCheckQueue.getJob(id);
        queueName = 'duplicate';
      }

      if (!job) {
        return reply.status(404).send({
          success: false,
          error: 'Job not found',
        });
      }

      // Get logs from BullMQ
      const logs = await organizeQueue.getJobLogs(id, 0, -1);

      return {
        success: true,
        jobId: id,
        queue: queueName,
        logs: logs.logs || [],
        count: logs.count || 0,
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching job logs');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch job logs',
      });
    }
  });
}
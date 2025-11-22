import type { FastifyInstance } from "fastify";
import { fileController } from "../controller/fileController.js";
import { logger } from "../lib/logger.js";
import { scanInfo } from "../services/scannerInfo.js";
import { findDuplicates } from "../services/hashService.js";
import { duplicateCheckQueue } from "../queues/fileQueue.js";

export async function duplicateRoutes(fastify: FastifyInstance) {
  // Get all duplicates from database
  fastify.get('/', async (request, reply) => {
    try {
      const duplicates = await fileController.getAllDuplicates();
      return {
        success: true,
        count: duplicates.length,
        duplicates,
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching duplicates');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch duplicates',
      });
    }
  });

  // Scan for duplicates (now using queue!)
  fastify.post<{
    Body: { sourcePath: string };
  }>('/scan', async (request, reply) => {
    try {
      const { sourcePath } = request.body;

      if (!sourcePath) {
        return reply.status(400).send({
          success: false,
          error: 'sourcePath is required',
        });
      }

      // Add job to queue
      const job = await duplicateCheckQueue.add(
        'scan-duplicates',
        { sourcePath }
      );

      logger.info({ jobId: job.id, sourcePath }, 'Duplicate scan job created');

      return {
        success: true,
        message: 'Duplicate detection job created',
        jobId: job.id,
        status: 'queued',
        statusUrl: `/api/jobs/${job.id}`,
      };
      
    } catch (error) {
      logger.error({ error }, 'Failed to create duplicate scan job');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create job',
      });
    }
  });

  // Find duplicates of a specific file
  fastify.get<{
    Params: { id: string };
  }>('/file/:id', async (request, reply) => {
    try {
      const fileId = parseInt(request.params.id);

      if (isNaN(fileId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid file ID',
        });
      }

      // Get the file
      const file = await fileController.getFileById(fileId);
      
      if (!file) {
        return reply.status(404).send({
          success: false,
          error: 'File not found',
        });
      }

      if (!file.hash) {
        return reply.status(404).send({
          success: false,
          error: 'File has no hash (not scanned for duplicates yet)',
        });
      }

      // Find all files with same hash
      const duplicates = await fileController.findDuplicatesByHash(file.hash);

      return {
        success: true,
        originalFile: file,
        duplicates: duplicates.filter(d => d.id !== fileId),
        count: duplicates.length - 1,
      };
    } catch (error) {
      logger.error({ error }, 'Error finding file duplicates');
      return reply.status(500).send({
        success: false,
        error: 'Failed to find duplicates',
      });
    }
  });
}
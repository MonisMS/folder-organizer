import Fastify from 'fastify';
import cors from '@fastify/cors';
import { scanInfo } from './services/scannerInfo.js';
import { fileRoutes } from './routes/filesRoutes.js';
import { historyRoutes } from './routes/historyRoutes.js';
import { duplicateRoutes } from './routes/duplicateRoutes.js';
import { jobRoutes } from './routes/jobRoutes.js';
import { scheduleRoutes } from './routes/scheduledRoutes.js';
import { logger } from './lib/logger.js';
import { startAllSchedules, stopAllSchedules } from './services/scheduleManager.js';

interface ScanQuery {
  path: string;
  extension?: string;
  sortBy?: string;
}

export async function buildApp() {
  try {
    const fastify = Fastify({
      logger: true,
    });

    // Register CORS
    await fastify.register(cors, {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        /\.vercel\.app$/,
      ],
      credentials: true,
    });

    // Legacy scan endpoint
    const VALID_SORT_OPTIONS = ['name', 'size'] as const;
    type SortOption = typeof VALID_SORT_OPTIONS[number];

    fastify.get<{ Querystring: ScanQuery }>('/scan', async (request, reply) => {
      const { path, extension, sortBy } = request.query;

      // Input validation
      if (!path) {
        return reply.status(400).send({ error: 'Path query parameter is required' });
      }

      if (typeof path !== 'string' || path.trim() === '') {
        return reply.status(400).send({ error: 'Path must be a non-empty string' });
      }

      if (sortBy && !VALID_SORT_OPTIONS.includes(sortBy as SortOption)) {
        return reply.status(400).send({ 
          error: `Invalid sortBy value. Must be one of: ${VALID_SORT_OPTIONS.join(', ')}` 
        });
      }

      try {
        const scanResult = await scanInfo(path);

        // Create a copy to avoid mutating the original result
        let files = [...scanResult.files];
        let totalFiles = scanResult.totalFiles;

        // Apply extension filter
        if (extension) {
          const normalizedExt = extension.toLowerCase();
          files = files.filter(
            (file) => file.extension.toLowerCase() === normalizedExt
          );
          totalFiles = files.length;
        }

        // Apply sorting
        if (sortBy === 'name') {
          files.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        } else if (sortBy === 'size') {
          files.sort((a, b) => a.size - b.size);
        }

        return reply.send({
          ...scanResult,
          files,
          totalFiles,
        });
      } catch (error) {
        logger.error({ error, path }, 'Error scanning directory');
        
        if (error instanceof Error) {
          // Handle common filesystem errors
          if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
            return reply.status(404).send({ error: 'Directory not found' });
          }
          if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
            return reply.status(403).send({ error: 'Permission denied to access directory' });
          }
          if (error.message.includes('ENOTDIR') || error.message.includes('not a directory')) {
            return reply.status(400).send({ error: 'Path is not a directory' });
          }
        }
        
        return reply.status(500).send({ error: 'Failed to scan directory' });
      }
    });

    await fastify.register(fileRoutes, { prefix: '/api/files' });
    await fastify.register(historyRoutes, { prefix: '/api/history' });
    await fastify.register(duplicateRoutes, { prefix: '/api/duplicates' });
    await fastify.register(jobRoutes, { prefix: '/api/jobs' });
    await fastify.register(scheduleRoutes, { prefix: '/api/schedules' });

    // Start schedules
    try {
      startAllSchedules();
    } catch (error) {
      logger.warn({ error }, 'Failed to start some schedules, continuing...');
    }

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');

      try {
        stopAllSchedules();
      } catch (error) {
        logger.warn({ error }, 'Error stopping schedules');
      }

      await fastify.close();
      logger.info('Server closed gracefully');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    return fastify;
  } catch (error) {
    logger.error({ error }, 'Failed to build app');
    throw error;
  }
}
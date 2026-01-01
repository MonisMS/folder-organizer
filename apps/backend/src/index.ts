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
    fastify.get<{ Querystring: ScanQuery }>('/scan', async (request, reply) => {
      const { path, extension, sortBy } = request.query;

      if (!path) {
        return reply.status(400).send({ error: 'Path query parameter is required' });
      }

      const result = await scanInfo(path);

      if (extension) {
        const filteredFiles = result.files.filter(
          (file) => file.extension.toLowerCase() === extension.toLowerCase()
        );
        result.files = filteredFiles;
        result.totalFiles = filteredFiles.length;
      }

      if (sortBy === 'name') {
        result.files.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      }

      if (sortBy === 'size') {
        result.files.sort((a, b) => a.size - b.size);
      }

      return reply.send(result);
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
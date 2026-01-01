import { buildApp } from './index.js';
import { logger } from './lib/logger.js';

async function startServer() {
  const port = Number(process.env.PORT) || 5000;
  
  try {
    logger.info({ port }, 'Starting server...');
    const app = await buildApp();
    await app.listen({ port, host: '0.0.0.0' });
    logger.info({ port }, 'Server started successfully');
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'EADDRINUSE') {
      logger.error({ port }, `Port ${port} is already in use. Please stop the existing process or use a different port.`);
    } else {
      logger.error({ error: err }, 'Failed to start server');
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection at Promise');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});

startServer();
import { buildApp } from "./index.js";
import { logger } from "./lib/logger.js";

async function startServer() {
  try {
    logger.info('🚀 Starting server...');
    const app = await buildApp();
    const port = Number(process.env.PORT) || 5000;
    await app.listen({ port, host: '0.0.0.0' });
    logger.info(`✅ Server running on http://localhost:${port}`);
  } catch (err) {
    logger.error({ error: err }, '❌ Failed to start server');
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection at Promise');
  console.error('Unhandled Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
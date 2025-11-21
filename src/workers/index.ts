import { logger } from '../lib/logger.js';
import { duplicateWorker } from './duplicate.js';
import { organizeWorker } from './organizeWorker.js';

logger.info('🚀 Starting all workers...');

// Workers are already started in their files
// This file just imports them

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info(' SIGTERM received, closing workers...');
  await organizeWorker.close();
  await duplicateWorker.close();
  logger.info(' Workers closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info(' SIGINT received, closing workers...');
  await organizeWorker.close();
  await duplicateWorker.close();
  logger.info(' Workers closed');
  process.exit(0);
});

logger.info('All workers running');
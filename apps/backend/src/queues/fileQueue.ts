import { Queue } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { logger } from "../lib/logger.js";

let organizeQueue: Queue;
let duplicateCheckQueue: Queue;

try {
  organizeQueue = new Queue("organizeQueue", {
    connection: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });

  duplicateCheckQueue = new Queue("duplicateCheckQueue", {
    connection: redisConfig,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 3000
      },
      removeOnComplete: 50,
      removeOnFail: 100,
    }
  });

  // Test Redis connection
  organizeQueue.on('error', (error) => {
    logger.error({ error }, '❌ Redis connection error in organizeQueue');
  });

  duplicateCheckQueue.on('error', (error) => {
    logger.error({ error }, '❌ Redis connection error in duplicateCheckQueue');
  });

  logger.info('✅ Job queues initialized');
} catch (error) {
  logger.error({ error }, '❌ Failed to initialize job queues. Make sure Redis is running.');
  // Don't throw - allow server to start without queues (for development)
  // In production, you might want to throw here
}

export { organizeQueue, duplicateCheckQueue };

process.on('SIGTERM', async () => {
  try {
    if (organizeQueue) await organizeQueue.close();
    if (duplicateCheckQueue) await duplicateCheckQueue.close();
    logger.info('✅ Queues closed gracefully');
  } catch (error) {
    logger.error({ error }, 'Error closing queues');
  }
});
import { Queue } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { logger } from "../lib/logger.js";

export const organizeQueue= new Queue("organizeQueue",{
    connection: redisConfig,
    defaultJobOptions:{
        attempts:3,
        backoff:{
            type:"exponential",
            delay:5000
        },
        removeOnComplete:100,
        removeOnFail:200,
    },
})

export const duplicateCheckQueue = new Queue("duplicateCheckQueue",{
    connection: redisConfig,
    defaultJobOptions:{
        attempts:2,
        backoff:{
            type:"exponential",
            delay:3000
        },
        removeOnComplete:50,
        removeOnFail:100,
    }
})
logger.info('Job queues initialized');
process.on('SIGTERM', async () => {
  await organizeQueue.close();
  await duplicateCheckQueue.close();
  logger.info('Queues closed gracefully');
});
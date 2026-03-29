import { Worker } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { logger } from "../lib/logger.js";
import { processDuplicateJob } from "./duplicateProcessor.js";

export const duplicateWorker = new Worker(
  "duplicateCheckQueue",
  processDuplicateJob,
  {
    connection: redisConfig,
    concurrency: 1, // CPU intensive, process one at a time
  }
);

duplicateWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "✅ Duplicate detection completed");
});

duplicateWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "❌ Duplicate detection failed");
});

logger.info("✅ Duplicate detection worker started");

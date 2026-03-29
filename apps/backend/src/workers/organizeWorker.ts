import { Worker } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { logger } from "../lib/logger.js";
import { processOrganizeJob } from "./organizeProcessor.js";

export const organizeWorker = new Worker(
  "organizeQueue",
  processOrganizeJob,
  {
    connection: redisConfig,
    concurrency: 2,
  }
);

organizeWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "✅ Job completed");
});

organizeWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "❌ Job failed");
});

organizeWorker.on("error", (err) => {
  logger.error({ error: err.message }, "💥 Worker error");
});

logger.info("✅ Organize worker started (concurrency: 2)");

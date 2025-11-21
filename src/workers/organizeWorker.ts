import { Worker, Job } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { logger } from "../lib/logger.js";
import { scanInfo } from "../services/scannerInfo.js";
import { classifyFiles } from "../services/fileClassifier.js";
import { moveFile } from "../services/fileMover.js";

interface OrganizeJobData {
  sourcePath: string;
  targetPath: string;
}

interface OrganizeJobResult {
  totalFiles: number;
  movedFiles: number;
  failedFiles: number;
  errors: string[];
}

export const organizeWorker = new Worker(
  "organizeQueue",
  async (job: Job<OrganizeJobData, OrganizeJobResult>) => {
    const { sourcePath, targetPath } = job.data;
    logger.info(
      { jobId: job.id, sourcePath, targetPath },
      "Starting organize job"
    );

    try {
      // Scan directory
      await job.updateProgress(10);
      await job.log("📂 Scanning source directory...");

      const scanResult = await scanInfo(sourcePath);
      await job.log(`✅ Found ${scanResult.totalFiles} files to organize`);

      // Classify files
      await job.updateProgress(20);
      await job.log("📋 Classifying files by type...");

      const categorizedFiles = classifyFiles(scanResult.files);
      await job.log(`✅ Files categorized into ${categorizedFiles.size} groups`);

      // Move files 
      let movedFiles = 0;
      let failedFiles = 0;
      const errors: string[] = [];
      const totalFiles = scanResult.totalFiles;
      let processedFiles = 0;

      for (const [category, fileList] of categorizedFiles.entries()) {
        await job.log(`📦 Processing ${fileList.length} files in category: ${category}`);

        for (const file of fileList) {
          try {
            await moveFile(file, category, targetPath);
            movedFiles++;
            await job.log(` Moved: ${file.name}`);
          } catch (error) {
            failedFiles++;
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(`${file.name}: ${errorMsg}`);
            await job.log(` Failed: ${file.name} - ${errorMsg}`);
          }

          // Update progress
          processedFiles++;
          const progress = 20 + Math.floor((processedFiles / totalFiles) * 80);
          await job.updateProgress(progress);
        }
      }

      await job.updateProgress(100);
      await job.log(" File organization completed!");

      const result: OrganizeJobResult = {
        totalFiles,
        movedFiles,
        failedFiles,
        errors: errors.slice(0, 50), // Limit errors
      };

      logger.info({ jobId: job.id, ...result }, "Organize job completed");
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await job.log(` Fatal error: ${errorMsg}`);
      logger.error({ jobId: job.id, error }, "Organize job failed");
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 2,
  }
);

// Event listeners
organizeWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, ' Job completed');
});

organizeWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, '❌ Job failed');
});

organizeWorker.on('error', (err) => {
  logger.error({ error: err.message }, '💥 Worker error');
});

logger.info(' Organize worker started (concurrency: 2)');

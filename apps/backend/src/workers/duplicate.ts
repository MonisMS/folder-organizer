import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { logger } from '../lib/logger.js';
import { scanInfo } from '../services/scannerInfo.js';
import { findDuplicates } from '../services/hashService.js';

interface DuplicateJobData {
  sourcePath: string;
}

interface DuplicateResult {
  scannedFiles: number;
  duplicateGroups: number;
  totalDuplicates: number;
  wastedSpace: number;
  duplicates: Array<{
    hash: string;
    count: number;
    totalSize: number;
    files: Array<{ path: string; name: string }>;
  }>;
}

export const duplicateWorker = new Worker(
  'duplicateCheckQueue',
  async (job: Job<DuplicateJobData, DuplicateResult>) => {
    const { sourcePath } = job.data;

    logger.info({ jobId: job.id, sourcePath }, 'Starting duplicate detection');

    try {
      // Step 1: Scan directory
      await job.updateProgress(10);
      await job.log(' Scanning directory...');
      const scanResult = await scanInfo(sourcePath);
      await job.log(` Found ${scanResult.totalFiles} files`);

      // Step 2: Hash files and find duplicates
      await job.updateProgress(30);
      await job.log(' Hashing files (this may take a while)...');
      
      const duplicates = await findDuplicates(
        scanResult.files.map(f => ({ path: f.path, name: f.name }))
      );

      await job.updateProgress(80);
      await job.log(`✅ Hashing complete`);

      // Step 3: Format results
      const duplicateGroups = Array.from(duplicates.entries()).map(([hash, fileList]) => ({
        hash,
        count: fileList.length,
        totalSize: fileList.reduce((sum, f) => {
          const file = scanResult.files.find(x => x.path === f.path);
          return sum + (file?.size || 0);
        }, 0),
        files: fileList,
      }));

      const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0);
      const wastedSpace = duplicateGroups.reduce(
        (sum, g) => sum + (g.totalSize * (g.count - 1)), 
        0
      );

      await job.updateProgress(100);
      await job.log(` Found ${duplicateGroups.length} duplicate groups`);
      await job.log(` Wasted space: ${(wastedSpace / 1024 / 1024).toFixed(2)} MB`);

      const result: DuplicateResult = {
        scannedFiles: scanResult.totalFiles,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates,
        wastedSpace,
        duplicates: duplicateGroups,
      };

      logger.info({ jobId: job.id, duplicateGroups: duplicateGroups.length }, 'Duplicate detection completed');
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await job.log(`💥 Error: ${errorMsg}`);
      logger.error({ jobId: job.id, error }, 'Duplicate detection failed');
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 1, // CPU intensive, process one at a time
  }
);

duplicateWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, ' Duplicate detection completed');
});

duplicateWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, '❌ Duplicate detection failed');
});

logger.info(' Duplicate detection worker started');
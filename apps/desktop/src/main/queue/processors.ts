import log from 'electron-log';
import { registerProcessor, type Job, type JobResult } from './jobQueue';
import { scanInfo } from '../services/scannerInfo';
import { classifyFiles } from '../services/fileClassifier';
import { moveFile } from '../services/fileMover';
import { findDuplicates } from '../services/hashService';

// Organize files processor
registerProcessor('organize', async (
  job: Job,
  updateProgress: (progress: number) => void,
  addLog: (message: string) => void
): Promise<JobResult> => {
  const { sourcePath, targetPath } = job.data;

  if (!targetPath) {
    throw new Error('Target path is required for organize job');
  }

  addLog('📂 Starting file organization...');
  addLog(`Source: ${sourcePath}`);
  addLog(`Target: ${targetPath}`);

  // Step 1: Scan directory
  await updateProgress(10);
  addLog('🔍 Scanning source directory...');
  
  const scanResult = await scanInfo(sourcePath);
  addLog(`✅ Found ${scanResult.totalFiles} files to organize`);

  if (scanResult.totalFiles === 0) {
    return {
      totalFiles: 0,
      movedFiles: 0,
      failedFiles: 0,
      errors: [],
    };
  }

  // Step 2: Classify files
  await updateProgress(20);
  addLog('📋 Classifying files by type...');
  
  const categorized = classifyFiles(scanResult.files);
  addLog(`✅ Files categorized into ${categorized.size} groups`);

  // Step 3: Move files
  let movedFiles = 0;
  let failedFiles = 0;
  const errors: string[] = [];
  const totalFiles = scanResult.totalFiles;
  let processedFiles = 0;

  for (const [category, fileList] of categorized.entries()) {
    addLog(`📦 Processing ${fileList.length} files in category: ${category}`);

    for (const file of fileList) {
      try {
        await moveFile(file, category, targetPath);
        movedFiles++;
        addLog(`  ✓ Moved: ${file.name}`);
      } catch (error) {
        failedFiles++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${file.name}: ${errorMsg}`);
        addLog(`  ✗ Failed: ${file.name} - ${errorMsg}`);
      }

      processedFiles++;
      const progress = 20 + Math.floor((processedFiles / totalFiles) * 75);
      await updateProgress(progress);
    }
  }

  await updateProgress(100);
  addLog('🎉 File organization completed!');
  addLog(`Results: ${movedFiles} moved, ${failedFiles} failed`);

  return {
    totalFiles,
    movedFiles,
    failedFiles,
    errors: errors.slice(0, 50), // Limit errors
  };
});

// Duplicate detection processor
registerProcessor('duplicate', async (
  job: Job,
  updateProgress: (progress: number) => void,
  addLog: (message: string) => void
): Promise<JobResult> => {
  const { sourcePath } = job.data;

  addLog('🔍 Starting duplicate detection...');
  addLog(`Source: ${sourcePath}`);

  // Step 1: Scan directory
  await updateProgress(10);
  addLog('📂 Scanning directory...');
  
  const scanResult = await scanInfo(sourcePath);
  addLog(`✅ Found ${scanResult.totalFiles} files to analyze`);

  if (scanResult.totalFiles === 0) {
    return {
      totalFiles: 0,
      duplicateGroups: 0,
      totalDuplicates: 0,
      wastedSpace: 0,
    };
  }

  // Step 2: Hash files and find duplicates
  await updateProgress(30);
  addLog('🔐 Hashing files (this may take a while)...');
  
  const duplicates = await findDuplicates(
    scanResult.files.map((f) => ({ path: f.path, name: f.name }))
  );

  await updateProgress(80);
  addLog('✅ Hashing complete');

  // Step 3: Format results
  const duplicateGroups = Array.from(duplicates.entries()).map(([hash, fileList]) => {
    const totalSize = fileList.reduce((sum, f) => {
      const file = scanResult.files.find((x) => x.path === f.path);
      return sum + (file?.size || 0);
    }, 0);

    return {
      hash,
      count: fileList.length,
      totalSize,
      files: fileList,
    };
  });

  const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0);
  const wastedSpace = duplicateGroups.reduce(
    (sum, g) => sum + (g.totalSize / g.count) * (g.count - 1),
    0
  );

  await updateProgress(100);
  addLog(`🎉 Found ${duplicateGroups.length} duplicate groups`);
  addLog(`📊 Wasted space: ${(wastedSpace / 1024 / 1024).toFixed(2)} MB`);

  return {
    totalFiles: scanResult.totalFiles,
    duplicateGroups: duplicateGroups.length,
    totalDuplicates,
    wastedSpace,
    duplicates: duplicateGroups,
  };
});

log.info('✅ Job processors registered');

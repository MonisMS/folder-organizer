import log from 'electron-log';
import { registerProcessor, type Job, type JobResult } from './jobQueue';
import { scanInfo } from '../services/scannerInfo';
import { classifyFiles } from '../services/fileClassifier';
import { moveFile } from '../services/fileMover';
import { generateFileHash } from '../services/hashService';
import { fileController } from '../controller/fileController';

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

  try {
    // Step 1: Scan directory
    await updateProgress(10);
    addLog('🔍 Scanning source directory...');
    
    const scanResult = await scanInfo(sourcePath);
    addLog(`✅ Found ${scanResult.totalFiles} files to organize`);

    if (scanResult.totalFiles === 0) {
      addLog('⚠️ No files found to organize');
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
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    addLog(`❌ Error: ${errorMsg}`);
    throw error;
  }
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

  try {
    // Step 1: Scan directory
    await updateProgress(10);
    addLog('📂 Scanning directory...');
    
    const scanResult = await scanInfo(sourcePath);
    addLog(`✅ Found ${scanResult.totalFiles} files to analyze`);

    if (scanResult.totalFiles === 0) {
      addLog('⚠️ No files found in directory');
      return {
        totalFiles: 0,
        duplicateGroups: 0,
        totalDuplicates: 0,
        wastedSpace: 0,
        duplicates: [],
      };
    }

    // Step 2: Hash files and save to database
    await updateProgress(20);
    addLog('🔐 Hashing files and saving to database...');
    addLog(`Processing ${scanResult.totalFiles} files...`);
    
    const hashMap = new Map<string, Array<{ path: string; name: string; size: number }>>();
    let processedCount = 0;
    let errorCount = 0;

    for (const file of scanResult.files) {
      try {
        const hash = await generateFileHash(file.path);
        
        // Save or update file in database with hash
        await fileController.upsertFileWithHash({
          name: file.name,
          originalPath: file.path,
          currentPath: file.path,
          size: file.size,
          extension: file.extension,
          hash,
        });

        // Track for duplicate detection
        if (!hashMap.has(hash)) {
          hashMap.set(hash, []);
        }
        hashMap.get(hash)!.push({ path: file.path, name: file.name, size: file.size });

        processedCount++;
        const progress = 20 + Math.floor((processedCount / scanResult.totalFiles) * 60);
        await updateProgress(progress);

        if (processedCount % 50 === 0) {
          addLog(`  Processed ${processedCount}/${scanResult.totalFiles} files...`);
        }
      } catch (error) {
        errorCount++;
        log.warn(`Failed to process ${file.path}:`, error);
      }
    }

    await updateProgress(85);
    addLog(`✅ Processed ${processedCount} files (${errorCount} errors)`);

    // Step 3: Find duplicates from hashMap
    const duplicateGroups: Array<{
      hash: string;
      count: number;
      totalSize: number;
      files: Array<{ path: string; name: string; size: number }>;
    }> = [];

    for (const [hash, fileList] of hashMap.entries()) {
      if (fileList.length > 1) {
        const totalSize = fileList.reduce((sum, f) => sum + f.size, 0);
        duplicateGroups.push({
          hash,
          count: fileList.length,
          totalSize,
          files: fileList,
        });
      }
    }

    const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0);
    const wastedSpace = duplicateGroups.reduce(
      (sum, g) => sum + (g.totalSize / g.count) * (g.count - 1),
      0
    );

    await updateProgress(100);
    
    if (duplicateGroups.length === 0) {
      addLog('✨ No duplicates found - all files are unique!');
    } else {
      addLog(`🎉 Found ${duplicateGroups.length} duplicate groups`);
      addLog(`📊 Total duplicate files: ${totalDuplicates}`);
      addLog(`💾 Wasted space: ${(wastedSpace / 1024 / 1024).toFixed(2)} MB`);
    }

    return {
      totalFiles: scanResult.totalFiles,
      duplicateGroups: duplicateGroups.length,
      totalDuplicates,
      wastedSpace,
      duplicates: duplicateGroups,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    addLog(`❌ Error: ${errorMsg}`);
    throw error;
  }
});

log.info('✅ Job processors registered');

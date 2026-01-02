import { rename, copyFile, unlink, stat, chmod, utimes } from 'fs/promises';
import log from 'electron-log';

interface NodeError extends Error {
  code?: string;
}

/**
 * Safely moves a file from source to destination, handling cross-filesystem moves (EXDEV).
 * 
 * - First attempts fs.rename (atomic, same filesystem)
 * - If EXDEV error (cross-device link), falls back to copy + unlink
 * - Preserves file mode and timestamps
 * - Cleans up partial copies on failure
 * - Propagates all other errors
 */
export async function moveFileSafe(source: string, dest: string): Promise<void> {
  try {
    // Try atomic rename first (works on same filesystem)
    await rename(source, dest);
  } catch (error) {
    const nodeError = error as NodeError;
    
    // If not EXDEV (cross-device), propagate the error
    if (nodeError.code !== 'EXDEV') {
      throw error;
    }

    log.info(`Cross-filesystem move detected for ${source}, using copy+unlink`);

    // Get source file stats to preserve mode and timestamps
    const sourceStats = await stat(source);
    let copySucceeded = false;

    try {
      // Copy the file to destination
      await copyFile(source, dest);
      copySucceeded = true;

      // Preserve file mode (permissions)
      await chmod(dest, sourceStats.mode);

      // Preserve access and modification times
      await utimes(dest, sourceStats.atime, sourceStats.mtime);

      // Remove the source file after successful copy
      await unlink(source);

      log.info(`Successfully moved file across filesystems: ${source} -> ${dest}`);
    } catch (copyError) {
      // Clean up partial copy on failure
      if (copySucceeded) {
        try {
          await unlink(dest);
          log.info(`Cleaned up partial copy at ${dest}`);
        } catch (cleanupError) {
          log.warn(`Failed to clean up partial copy at ${dest}:`, cleanupError);
        }
      }

      throw copyError;
    }
  }
}

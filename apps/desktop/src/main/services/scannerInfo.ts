import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import log from 'electron-log';
import type { FileInfo, ScanResult } from '@file-manager/shared';
import { config } from '../config';

export async function scanInfo(dirPath: string): Promise<ScanResult> {
  const files: FileInfo[] = [];
  const scannedAt = new Date();

  async function scanDirectory(currentPath: string, depth: number = 0): Promise<void> {
    // Limit recursion depth for safety
    if (depth > 10) {
      log.warn(`Max depth reached at: ${currentPath}`);
      return;
    }

    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);

        // Skip ignored folders
        if (entry.isDirectory()) {
          if (config.ignoredFolders.includes(entry.name)) {
            continue;
          }

          // Only scan root files if configured
          if (!config.onlyOrganizeRootFiles) {
            await scanDirectory(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          try {
            const stats = await stat(fullPath);
            const extension = extname(entry.name).toLowerCase();

            files.push({
              name: entry.name,
              path: fullPath,
              size: stats.size,
              extension: extension || '.unknown',
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
            });
          } catch (err: any) {
            // Skip files that are in use, permission denied, or other access issues
            if (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') {
              log.debug(`Skipping inaccessible file: ${fullPath} (${err.code})`);
            } else {
              log.warn(`Could not stat file: ${fullPath}`, err);
            }
          }
        }
      }
    } catch (err) {
      log.error(`Error scanning directory: ${currentPath}`, err);
      throw err;
    }
  }

  await scanDirectory(dirPath);

  return {
    files,
    totalFiles: files.length,
    scannedAt,
    scannedPath: dirPath,
  };
}

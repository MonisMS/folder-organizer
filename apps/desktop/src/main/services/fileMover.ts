import { access, mkdir, rename } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import log from 'electron-log';
import type { FileInfo } from '@file-manager/shared';
import { fileController } from '../controller/fileController';
import { generateFileHash } from './hashService';

export interface MoveResult {
  success: boolean;
  originalPath: string;
  newPath?: string;
  error?: string;
  dbFileId?: number;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectoryExists(dirPath: string): Promise<string> {
  try {
    await mkdir(dirPath, { recursive: true });
    log.info(`Directory ensured: ${dirPath}`);
    return dirPath;
  } catch (error) {
    log.error({ error, dirPath }, 'Failed to create directory');
    throw error;
  }
}

async function generateUniquePath(filePath: string): Promise<string> {
  let counter = 1;
  let uniquePath = filePath;

  const ext = extname(filePath);
  const baseName = basename(filePath, ext);
  const dir = dirname(filePath);

  while (await fileExists(uniquePath)) {
    uniquePath = join(dir, `${baseName} (${counter})${ext}`);
    counter++;
  }

  return uniquePath;
}

export async function moveFile(
  file: FileInfo,
  targetCategory: string,
  organizedRoot: string
): Promise<MoveResult> {
  try {
    const originalPath = file.path;
    const targetPath = join(organizedRoot, targetCategory, file.name);
    const targetDir = dirname(targetPath);

    // Ensure target directory exists
    log.info(`Ensuring directory exists: ${targetDir}`);
    await ensureDirectoryExists(targetDir);

    let finalPath = targetPath;

    if (await fileExists(targetPath)) {
      log.warn(`File already exists at ${targetPath}. Generating unique name.`);
      finalPath = await generateUniquePath(targetPath);
    }

    // Generate hash before moving
    const fileHash = await generateFileHash(file.path);
    log.info(`File hash: ${fileHash}`);

    // Move the file
    log.info(`Moving file from ${file.path} to ${finalPath}`);
    await rename(file.path, finalPath);
    log.info(`Successfully moved file to ${finalPath}`);

    // Save to database
    const dbFile = await fileController.createFile({
      name: file.name,
      originalPath,
      currentPath: finalPath,
      size: file.size,
      extension: file.extension,
      category: targetCategory,
      hash: fileHash,
      organizedAt: new Date(),
    });

    // Log the operation
    await fileController.logOperation(
      'moved',
      dbFile!.id,
      JSON.stringify({
        category: targetCategory,
        originalPath,
        currentPath: finalPath,
        hash: fileHash,
      })
    );

    return {
      success: true,
      originalPath: file.path,
      newPath: finalPath,
      dbFileId: dbFile!.id,
    };
  } catch (error) {
    log.error({ error, file: file.name }, 'Failed to move file');

    return {
      success: false,
      originalPath: file.path,
      newPath: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

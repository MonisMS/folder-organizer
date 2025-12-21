import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import log from 'electron-log';

export async function generateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        const finalHash = hash.digest('hex');
        log.debug(`Generated hash for ${filePath}: ${finalHash.substring(0, 16)}...`);
        resolve(finalHash);
      });

      stream.on('error', (error) => {
        log.error(`Error hashing file ${filePath}:`, error);
        reject(error);
      });
    } catch (error) {
      log.error(`Failed to create hash stream for ${filePath}:`, error);
      reject(error);
    }
  });
}

export async function findDuplicates(
  files: { path: string; name: string }[]
): Promise<Map<string, Array<{ path: string; name: string }>>> {
  const hashMap = new Map<string, Array<{ path: string; name: string }>>();

  for (const file of files) {
    try {
      const hash = await generateFileHash(file.path);

      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }

      hashMap.get(hash)!.push(file);
    } catch (error) {
      log.warn(`Skipping file ${file.path} due to hash error`);
    }
  }

  // Filter to only duplicates (more than one file with same hash)
  const duplicates = new Map<string, Array<{ path: string; name: string }>>();

  for (const [hash, fileList] of hashMap.entries()) {
    if (fileList.length > 1) {
      duplicates.set(hash, fileList);
      log.info(`Found ${fileList.length} duplicates with hash ${hash.substring(0, 16)}...`);
    }
  }

  return duplicates;
}

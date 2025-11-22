import { createHash } from "crypto";
import { createReadStream } from "fs";
import { logger } from "../lib/logger.js";

export async function generateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (chunk: Buffer) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        const finalHash = hash.digest('hex');
        logger.info(`Generated hash for ${filePath}: ${finalHash}`);
        resolve(finalHash);
      });

      stream.on('error', (error) => {
        logger.error(`Error hashing file ${filePath}:`, error);
        reject(error);
      });
    } catch (error) {
      logger.error(`Failed to create hash stream for ${filePath}:`, error);
      reject(error);
    }
  });
}



export async function findDuplicates(
    files:{path:string; name:string}[]
):Promise<Map<string,Array<{path:string; name:string}>>> {
    const hashMap = new Map<string, Array<{ path: string; name: string }>>();

  
  for (const file of files) {
    try {
      const hash = await generateFileHash(file.path);
      
      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      
      hashMap.get(hash)!.push(file);
    } catch (error) {
      logger.warn(`Skipping file ${file.path} due to hash error`);
    }
  }
  const duplicates = new Map<string, Array<{ path: string; name: string }>>();
  
  for (const [hash, fileList] of hashMap.entries()) {
    if (fileList.length > 1) {
      duplicates.set(hash, fileList);
      logger.info(`Found ${fileList.length} duplicates with hash ${hash}`);
    }
  }
  return duplicates;
}
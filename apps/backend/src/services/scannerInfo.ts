import { readdir, stat } from "fs/promises";
import type { FileInfo, ScanResult } from "../types/type.js";
import path from "path";
import { logger } from "../lib/logger.js";



export async function scanInfo(folderPath: string):Promise<ScanResult> {
try {
    const folderStats = await stat(folderPath);
    const isDirectory = folderStats.isDirectory();

    if(!isDirectory){
        throw new Error (`The path ${folderPath} is not a directory.`);
    }


    const fileNames = await readdir(folderPath);

    const filesMetadata = await Promise.all(
        fileNames.map(async (fileName) =>{
            const filePath = path.join(folderPath,fileName)
            const stats = await stat(filePath)

            if (stats.isDirectory()) {
          return null;  // We'll filter this out later
        }

            const fileInfo : FileInfo = {
                name: fileName,
                path: filePath,
                size:stats.size,
                extension:path.extname(fileName),
                createdAt:stats.birthtime,
                modifiedAt:stats.mtime
                
            }
            return fileInfo;
        })
    )


const validFiles = filesMetadata.filter((file): file is FileInfo => file !== null);

const result : ScanResult = {
    files: validFiles,
    totalFiles: validFiles.length,
    scannedPath: folderPath,
    scannedAt: new Date()
}
return result;
    
} catch (error) {
logger.error({ error, folderPath }, 'Failed to scan folder');
  throw error;}
}









import { access, mkdir,rename } from "fs/promises";
import type { FileInfo } from "../types/type.js";
import path from "path";
import { logger } from "../lib/logger.js";


export interface MoveResult{
    success:boolean;
    originalPath:string;
    newPath?:string;
    error?:string;
}

export async function fileExists(filePath:string):Promise<boolean>{
    try {
    await access(filePath);
    return true;
    } catch (error) {
        return false;

    }
}

export async function ensureDirectoryExists(dirPath:string):Promise<string>{
    await mkdir(dirPath,{recursive:true});
}

async function generateUniquePath(filePath:string):Promise<string> {
let counter = 1;
let uniquePath = filePath;

const ext = path.extname(filePath);
const baseName = path.basename(filePath, ext);
const dir = path.dirname(filePath);

while (await fileExists(uniquePath)){
    uniquePath = path.join(dir,`${baseName} (${counter})${ext}`);
    counter++;
}
return uniquePath;
    
}


export async function moveFile(
    file:FileInfo,
    targetFolder:string,
    organizedRoot:string
): Promise<MoveResult>{
try {
    const targetPath = path.join(organizedRoot,targetFolder,file.name);

    const targetDir =path.dirname(targetPath);
    await ensureDirectoryExists(targetDir);

    let finalPath = targetPath;

    if(await fileExists(targetPath)){
        logger.warn(`File already exists at ${targetPath}. Generating unique name.`);
        finalPath = await generateUniquePath(targetPath);
    }

    logger.info(`Moving file from ${file.path} to ${finalPath}`);
    await rename(file.path,finalPath);


    return {
        success:true,
        originalPath:file.path,
        newPath:finalPath
    }
} catch (error) {
    logger.error({ error, file: file.name }, 'Failed to move file');
    
    return {
      success: false,
      originalPath: file.path,
      newPath: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  
}
}
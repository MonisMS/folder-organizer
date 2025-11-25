import { desc, eq, isNotNull, sql, and, gte } from "drizzle-orm";
import { db } from "../db/index.js";
import { files, logs, type NewFile } from "../db/schema.js";
import { rename, mkdir, access } from "fs/promises";
import path from "path";

export class FileController {
    async createFile(filedata:NewFile){
        if(!filedata)
        {
            throw new Error("File data is required");
        }

        const [newFile] = await db.insert(files).values(filedata).returning();
        return newFile;
    }

    async getFileById(id:number){
        const [file] = await db.select().from(files)
        .where(eq(files.id,id));
        return file;
    }

    async getAllFiles(){
        return await db.select().from(files);
    }
    async updateFilePath(id:number,newPath:string){
        const [updated] = await db.update(files)
        .set({currentPath:newPath, updatedAt: new Date()})
        .where(eq(files.id,id))
        .returning();
        return updated;
    }

    async logOperation(action: string, fileId?: number, metadata?: string){
        const [log] = await db.insert(logs).values({
            action,
            fileId,
            metadata
        }).returning();
        return log;
    }
    async getFileHistory(fileId:number){
        return await db.select().from(logs)
        .where(eq(logs.fileId,fileId))
        .orderBy(desc(logs.timestamp));
    }
   
  async getRecentOperations(limit: number = 10) {
    const recentLogs = await db.select({
      id: logs.id,
      action: logs.action,
      fileId: logs.fileId,
      timestamp: logs.timestamp,
      metadata: logs.metadata,
      fileName: files.name,
      category: files.category,
      originalPath: files.originalPath,
      currentPath: files.currentPath,
    })
    .from(logs)
    .leftJoin(files, eq(logs.fileId, files.id))
    .orderBy(desc(logs.timestamp))
    .limit(limit);
    return recentLogs;
  }



  async findDuplicatesByHash(hash: string) {
  const duplicates = await db
    .select()
    .from(files)
    .where(eq(files.hash, hash));
  
  return duplicates;
}

async getAllDuplicates() {
  // Find all hashes that appear more than once
  const result = await db
    .select({
      hash: files.hash,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(files)
    .where(isNotNull(files.hash))
    .groupBy(files.hash)
    .having(sql`count(*) > 1`);

  // Get full file details for each duplicate hash
  const duplicateGroups = [];
  
  for (const { hash } of result) {
    const fileList = await this.findDuplicatesByHash(hash!);
    duplicateGroups.push({
      hash,
      files: fileList,
      count: fileList.length,
    });
  }

  return duplicateGroups;
}

  // Undo a single file move
  async undoFileMove(fileId: number): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
    try {
      const file = await this.getFileById(fileId);
      if (!file) {
        return { success: false, error: 'File not found' };
      }

      // Check if file was already undone (originalPath === currentPath)
      if (file.originalPath === file.currentPath) {
        return { success: true, skipped: true }; // Already at original location - count as success
      }

      // Ensure the original directory exists
      const originalDir = path.dirname(file.originalPath);
      await mkdir(originalDir, { recursive: true });

      // Check if file exists at current path
      try {
        await access(file.currentPath);
      } catch {
        // File doesn't exist at currentPath, check if it's already at original
        try {
          await access(file.originalPath);
          // File is already at original location - update DB and return success
          await db.update(files)
            .set({ 
              currentPath: file.originalPath,
              updatedAt: new Date(),
              organizedAt: null
            })
            .where(eq(files.id, fileId));
          return { success: true, skipped: true };
        } catch {
          return { success: false, error: 'File not found at current or original path' };
        }
      }

      // Move file back to original location
      await rename(file.currentPath, file.originalPath);

      // Update database
      await db.update(files)
        .set({ 
          currentPath: file.originalPath,
          updatedAt: new Date(),
          organizedAt: null
        })
        .where(eq(files.id, fileId));

      // Log the undo operation
      await this.logOperation('undone', fileId, JSON.stringify({
        previousPath: file.currentPath,
        restoredPath: file.originalPath
      }));

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Undo all files from a specific job or time range
  async undoRecentOrganization(options?: { 
    since?: Date; 
    jobId?: string;
    limit?: number;
  }): Promise<{ 
    success: boolean; 
    undoneCount: number; 
    skippedCount: number;
    failedCount: number; 
    errors: string[];
  }> {
    const errors: string[] = [];
    let undoneCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Get files that were organized recently
    const since = options?.since || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    
    const organizedFiles = await db.select()
      .from(files)
      .where(
        and(
          isNotNull(files.organizedAt),
          gte(files.organizedAt, since)
        )
      )
      .limit(options?.limit || 1000);

    for (const file of organizedFiles) {
      // Skip files already at original location
      if (file.originalPath === file.currentPath) {
        skippedCount++;
        continue;
      }

      const result = await this.undoFileMove(file.id);
      if (result.success) {
        if (result.skipped) {
          skippedCount++;
        } else {
          undoneCount++;
        }
      } else {
        failedCount++;
        errors.push(`${file.name}: ${result.error}`);
      }
    }

    return {
      success: failedCount === 0, // Success if no actual failures
      undoneCount,
      skippedCount,
      failedCount,
      errors: errors.slice(0, 50) // Limit errors
    };
  }

  // Get files that can be undone
  async getUndoableFiles(since?: Date) {
    const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return await db.select()
      .from(files)
      .where(
        and(
          isNotNull(files.organizedAt),
          gte(files.organizedAt, sinceDate),
          sql`${files.originalPath} != ${files.currentPath}`
        )
      )
      .orderBy(desc(files.organizedAt));
  }
}

export const fileController = new FileController();
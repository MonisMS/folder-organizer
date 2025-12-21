import { eq, desc, isNotNull, and, gte, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { files, logs, type NewFile } from '../db/schema';
import { rename, mkdir, access } from 'fs/promises';
import { dirname } from 'path';
import log from 'electron-log';

class FileController {
  async createFile(fileData: NewFile) {
    if (!fileData) {
      throw new Error('File data is required');
    }

    const db = getDb();
    const [newFile] = await db.insert(files).values(fileData).returning();
    return newFile;
  }

  async getFileById(id: number) {
    const db = getDb();
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getAllFiles() {
    const db = getDb();
    return await db.select().from(files);
  }

  async updateFilePath(id: number, newPath: string) {
    const db = getDb();
    const [updated] = await db
      .update(files)
      .set({ currentPath: newPath, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    return updated;
  }

  async logOperation(action: string, fileId?: number, metadata?: string) {
    const db = getDb();
    const [logEntry] = await db
      .insert(logs)
      .values({
        action,
        fileId,
        metadata,
      })
      .returning();
    return logEntry;
  }

  async getFileHistory(fileId: number) {
    const db = getDb();
    return await db
      .select()
      .from(logs)
      .where(eq(logs.fileId, fileId))
      .orderBy(desc(logs.timestamp));
  }

  async getRecentOperations(limit: number = 10) {
    const db = getDb();
    const recentLogs = await db
      .select({
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
    const db = getDb();
    const duplicates = await db.select().from(files).where(eq(files.hash, hash));
    return duplicates;
  }

  async getAllDuplicates() {
    const db = getDb();
    
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

  async undoFileMove(fileId: number): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
    const db = getDb();
    
    try {
      const file = await this.getFileById(fileId);
      if (!file) {
        return { success: false, error: 'File not found' };
      }

      // Check if file was already undone
      if (file.originalPath === file.currentPath) {
        return { success: true, skipped: true };
      }

      // Ensure the original directory exists
      const originalDir = dirname(file.originalPath);
      await mkdir(originalDir, { recursive: true });

      // Check if file exists at current path
      try {
        await access(file.currentPath);
      } catch {
        try {
          await access(file.originalPath);
          // File is already at original location
          await db
            .update(files)
            .set({
              currentPath: file.originalPath,
              updatedAt: new Date(),
              organizedAt: null,
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
      await db
        .update(files)
        .set({
          currentPath: file.originalPath,
          updatedAt: new Date(),
          organizedAt: null,
        })
        .where(eq(files.id, fileId));

      // Log the undo operation
      await this.logOperation(
        'undone',
        fileId,
        JSON.stringify({
          previousPath: file.currentPath,
          restoredPath: file.originalPath,
        })
      );

      return { success: true };
    } catch (error) {
      log.error('Failed to undo file move:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async undoRecentOrganization(options?: { since?: Date; limit?: number }): Promise<{
    success: boolean;
    undoneCount: number;
    skippedCount: number;
    failedCount: number;
    errors: string[];
  }> {
    const db = getDb();
    const errors: string[] = [];
    let undoneCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const since = options?.since || new Date(Date.now() - 24 * 60 * 60 * 1000);

    const organizedFiles = await db
      .select()
      .from(files)
      .where(and(isNotNull(files.organizedAt), gte(files.organizedAt, since)))
      .limit(options?.limit || 1000);

    for (const file of organizedFiles) {
      const result = await this.undoFileMove(file.id);

      if (result.success) {
        if (result.skipped) {
          skippedCount++;
        } else {
          undoneCount++;
        }
      } else {
        failedCount++;
        if (result.error) {
          errors.push(`${file.name}: ${result.error}`);
        }
      }
    }

    return {
      success: failedCount === 0,
      undoneCount,
      skippedCount,
      failedCount,
      errors,
    };
  }

  async getUndoableFiles(since?: Date) {
    const db = getDb();
    const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000);

    const undoableFiles = await db
      .select({
        id: files.id,
        name: files.name,
        originalPath: files.originalPath,
        currentPath: files.currentPath,
        category: files.category,
        organizedAt: files.organizedAt,
      })
      .from(files)
      .where(and(isNotNull(files.organizedAt), gte(files.organizedAt, sinceDate)));

    // Filter to only files that can be undone (current != original)
    const filteredFiles = undoableFiles.filter(
      (f) => f.currentPath !== f.originalPath
    );

    return {
      files: filteredFiles,
      count: filteredFiles.length,
    };
  }
}

export const fileController = new FileController();

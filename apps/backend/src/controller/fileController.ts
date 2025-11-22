import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { files, logs, type NewFile } from "../db/schema.js";

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
     const recentLogs = await db.select()
  .from(logs)
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
}

export const fileController = new FileController();
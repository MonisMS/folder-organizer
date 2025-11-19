import { desc, eq } from "drizzle-orm";
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
}

export const fileController = new FileController();
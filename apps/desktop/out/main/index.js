"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const log = require("electron-log");
const electronUpdater = require("electron-updater");
const promises = require("fs/promises");
const fs = require("fs");
const events = require("events");
const Database = require("better-sqlite3");
const betterSqlite3 = require("drizzle-orm/better-sqlite3");
const sqliteCore = require("drizzle-orm/sqlite-core");
const drizzleOrm = require("drizzle-orm");
const cron = require("node-cron");
const defaultOrganizedRoot = path.join(electron.app.getPath("documents"), "Organized Files");
const config = {
  organizedRoot: defaultOrganizedRoot,
  sourceFolder: "",
  onlyOrganizeRootFiles: true,
  ignoredFolders: [
    "node_modules",
    "Program Files",
    "Program Files (x86)",
    "Windows",
    "System32",
    ".git",
    "AppData",
    "$Recycle.Bin",
    "Recovery"
  ],
  categories: [
    {
      name: "Documents",
      extensions: [".pdf", ".doc", ".docx", ".txt", ".xlsx", ".pptx", ".csv", ".rtf", ".odt", ".xls"],
      targetFolder: "Documents"
    },
    {
      name: "Images",
      extensions: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".bmp", ".webp", ".ico", ".tiff", ".raw"],
      targetFolder: "Images"
    },
    {
      name: "Videos",
      extensions: [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v", ".mpeg"],
      targetFolder: "Videos"
    },
    {
      name: "Audio",
      extensions: [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma", ".opus"],
      targetFolder: "Audio"
    },
    {
      name: "Archives",
      extensions: [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz"],
      targetFolder: "Archives"
    },
    {
      name: "Code",
      extensions: [".js", ".ts", ".py", ".java", ".cpp", ".c", ".html", ".css", ".json", ".xml", ".md"],
      targetFolder: "Code"
    },
    {
      name: "Executables",
      extensions: [".exe", ".msi", ".dmg", ".deb", ".rpm", ".app", ".bat", ".sh"],
      targetFolder: "Executables"
    }
  ]
};
async function scanInfo(dirPath) {
  const files2 = [];
  const scannedAt = /* @__PURE__ */ new Date();
  async function scanDirectory(currentPath, depth = 0) {
    if (depth > 10) {
      log.warn(`Max depth reached at: ${currentPath}`);
      return;
    }
    try {
      const entries = await promises.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          if (config.ignoredFolders.includes(entry.name)) {
            continue;
          }
          if (!config.onlyOrganizeRootFiles) ;
        } else if (entry.isFile()) {
          try {
            const stats = await promises.stat(fullPath);
            const extension = path.extname(entry.name).toLowerCase();
            files2.push({
              name: entry.name,
              path: fullPath,
              size: stats.size,
              extension: extension || ".unknown",
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime
            });
          } catch (err) {
            log.warn(`Could not stat file: ${fullPath}`, err);
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
    files: files2,
    totalFiles: files2.length,
    scannedAt,
    scannedPath: dirPath
  };
}
function classifyFile(file) {
  const extension = file.extension.toLowerCase();
  for (const category of config.categories) {
    if (category.extensions.includes(extension)) {
      return category.targetFolder;
    }
  }
  return "Others";
}
function classifyFiles(files2) {
  const categorized = /* @__PURE__ */ new Map();
  for (const file of files2) {
    const category = classifyFile(file);
    if (!categorized.has(category)) {
      categorized.set(category, []);
    }
    categorized.get(category).push(file);
  }
  return categorized;
}
const files = sqliteCore.sqliteTable("files", {
  id: sqliteCore.integer("id").primaryKey({ autoIncrement: true }),
  name: sqliteCore.text("name").notNull(),
  originalPath: sqliteCore.text("original_path").notNull(),
  currentPath: sqliteCore.text("current_path").notNull(),
  size: sqliteCore.integer("size").notNull(),
  extension: sqliteCore.text("extension").notNull(),
  category: sqliteCore.text("category"),
  hash: sqliteCore.text("hash"),
  scannedAt: sqliteCore.integer("scanned_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  organizedAt: sqliteCore.integer("organized_at", { mode: "timestamp" }),
  updatedAt: sqliteCore.integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => ({
  hashIdx: sqliteCore.index("hash_idx").on(table.hash),
  categoryIdx: sqliteCore.index("category_idx").on(table.category)
}));
const logs = sqliteCore.sqliteTable("logs", {
  id: sqliteCore.integer("id").primaryKey({ autoIncrement: true }),
  action: sqliteCore.text("action").notNull(),
  // 'scanned', 'moved', 'deleted', 'undone'
  fileId: sqliteCore.integer("file_id").references(() => files.id),
  timestamp: sqliteCore.integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  metadata: sqliteCore.text("metadata")
  // JSON string with operation details
}, (table) => ({
  actionIdx: sqliteCore.index("action_idx").on(table.action),
  timestampIdx: sqliteCore.index("timestamp_idx").on(table.timestamp)
}));
const jobs = sqliteCore.sqliteTable("jobs", {
  id: sqliteCore.text("id").primaryKey(),
  type: sqliteCore.text("type").notNull(),
  // 'organize', 'duplicate'
  status: sqliteCore.text("status").notNull(),
  // 'waiting', 'active', 'completed', 'failed'
  progress: sqliteCore.integer("progress").default(0),
  data: sqliteCore.text("data"),
  // JSON string with job input
  result: sqliteCore.text("result"),
  // JSON string with job result
  error: sqliteCore.text("error"),
  logs: sqliteCore.text("logs"),
  // JSON array of log messages
  createdAt: sqliteCore.integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  startedAt: sqliteCore.integer("started_at", { mode: "timestamp" }),
  completedAt: sqliteCore.integer("completed_at", { mode: "timestamp" })
}, (table) => ({
  statusIdx: sqliteCore.index("job_status_idx").on(table.status),
  typeIdx: sqliteCore.index("job_type_idx").on(table.type)
}));
const settings = sqliteCore.sqliteTable("settings", {
  key: sqliteCore.text("key").primaryKey(),
  value: sqliteCore.text("value").notNull(),
  updatedAt: sqliteCore.integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  files,
  jobs,
  logs,
  settings
}, Symbol.toStringTag, { value: "Module" }));
let sqlite = null;
let db = null;
function getDbPath() {
  const userDataPath = electron.app.getPath("userData");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, "file-manager.db");
}
async function initDatabase() {
  const dbPath = getDbPath();
  log.info(`📁 Database path: ${dbPath}`);
  try {
    sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    db = betterSqlite3.drizzle(sqlite, { schema });
    await runMigrations();
    log.info("✅ Database initialized successfully");
  } catch (error) {
    log.error("❌ Failed to initialize database:", error);
    throw error;
  }
}
async function runMigrations() {
  if (!sqlite) throw new Error("Database not initialized");
  sqlite.exec(`
    -- Files table
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      original_path TEXT NOT NULL,
      current_path TEXT NOT NULL,
      size INTEGER NOT NULL,
      extension TEXT NOT NULL,
      category TEXT,
      hash TEXT,
      scanned_at INTEGER NOT NULL DEFAULT (unixepoch()),
      organized_at INTEGER,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    
    CREATE INDEX IF NOT EXISTS hash_idx ON files(hash);
    CREATE INDEX IF NOT EXISTS category_idx ON files(category);
    
    -- Logs table
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      file_id INTEGER REFERENCES files(id),
      timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
      metadata TEXT
    );
    
    CREATE INDEX IF NOT EXISTS action_idx ON logs(action);
    CREATE INDEX IF NOT EXISTS timestamp_idx ON logs(timestamp);
    
    -- Jobs table
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      data TEXT,
      result TEXT,
      error TEXT,
      logs TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      started_at INTEGER,
      completed_at INTEGER
    );
    
    CREATE INDEX IF NOT EXISTS job_status_idx ON jobs(status);
    CREATE INDEX IF NOT EXISTS job_type_idx ON jobs(type);
    
    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
  log.info("✅ Database migrations completed");
}
function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}
new events.EventEmitter();
const activeJobs = /* @__PURE__ */ new Map();
const processors = {};
function generateJobId(type) {
  const prefix = type === "organize" ? "org" : "dup";
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function sendToRenderer(channel, data) {
  electron.BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, data);
  });
}
async function createJob(type, data) {
  const id = generateJobId(type);
  const db2 = getDb();
  const job = {
    id,
    type,
    status: "waiting",
    progress: 0,
    data,
    logs: [],
    createdAt: /* @__PURE__ */ new Date()
  };
  await db2.insert(jobs).values({
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    data: JSON.stringify(job.data),
    logs: JSON.stringify(job.logs),
    createdAt: job.createdAt
  });
  activeJobs.set(id, job);
  log.info(`📋 Job created: ${id} (${type})`);
  processJob(job);
  return job;
}
async function processJob(job) {
  const processor = processors[job.type];
  if (!processor) {
    log.error(`No processor registered for job type: ${job.type}`);
    await updateJobStatus(job.id, "failed", void 0, "No processor found");
    return;
  }
  job.status = "active";
  job.startedAt = /* @__PURE__ */ new Date();
  await saveJobToDb(job);
  sendToRenderer("job:active", { id: job.id });
  log.info(`▶️ Job started: ${job.id}`);
  const updateProgress = async (progress) => {
    job.progress = progress;
    await saveJobToDb(job);
    sendToRenderer("job:progress", { id: job.id, progress });
  };
  const addLog = async (message) => {
    job.logs.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`);
    await saveJobToDb(job);
  };
  try {
    const result = await processor(job, updateProgress, addLog);
    job.status = "completed";
    job.progress = 100;
    job.result = result;
    job.completedAt = /* @__PURE__ */ new Date();
    await saveJobToDb(job);
    sendToRenderer("job:completed", { id: job.id, result });
    log.info(`✅ Job completed: ${job.id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    job.status = "failed";
    job.error = errorMessage;
    job.completedAt = /* @__PURE__ */ new Date();
    await saveJobToDb(job);
    sendToRenderer("job:failed", { id: job.id, error: errorMessage });
    log.error(`❌ Job failed: ${job.id}`, error);
  }
}
async function saveJobToDb(job) {
  const db2 = getDb();
  await db2.update(jobs).set({
    status: job.status,
    progress: job.progress,
    result: job.result ? JSON.stringify(job.result) : null,
    error: job.error,
    logs: JSON.stringify(job.logs),
    startedAt: job.startedAt,
    completedAt: job.completedAt
  }).where(drizzleOrm.eq(jobs.id, job.id));
}
async function updateJobStatus(id, status, result, error) {
  const job = activeJobs.get(id);
  if (!job) return;
  job.status = status;
  job.error = error;
  {
    job.completedAt = /* @__PURE__ */ new Date();
  }
  await saveJobToDb(job);
}
async function getJob(id) {
  const activeJob = activeJobs.get(id);
  if (activeJob) return activeJob;
  const db2 = getDb();
  const [dbJob] = await db2.select().from(jobs).where(drizzleOrm.eq(jobs.id, id));
  if (!dbJob) return null;
  return {
    id: dbJob.id,
    type: dbJob.type,
    status: dbJob.status,
    progress: dbJob.progress || 0,
    data: dbJob.data ? JSON.parse(dbJob.data) : {},
    result: dbJob.result ? JSON.parse(dbJob.result) : void 0,
    error: dbJob.error || void 0,
    logs: dbJob.logs ? JSON.parse(dbJob.logs) : [],
    createdAt: dbJob.createdAt,
    startedAt: dbJob.startedAt || void 0,
    completedAt: dbJob.completedAt || void 0
  };
}
async function getJobsByType(type) {
  const db2 = getDb();
  const dbJobs = await db2.select().from(jobs).where(drizzleOrm.eq(jobs.type, type));
  return dbJobs.map((dbJob) => ({
    id: dbJob.id,
    type: dbJob.type,
    status: dbJob.status,
    progress: dbJob.progress || 0,
    data: dbJob.data ? JSON.parse(dbJob.data) : {},
    result: dbJob.result ? JSON.parse(dbJob.result) : void 0,
    error: dbJob.error || void 0,
    logs: dbJob.logs ? JSON.parse(dbJob.logs) : [],
    createdAt: dbJob.createdAt,
    startedAt: dbJob.startedAt || void 0,
    completedAt: dbJob.completedAt || void 0
  }));
}
async function cancelJob(id) {
  const job = activeJobs.get(id);
  if (!job || job.status !== "waiting") {
    return false;
  }
  job.status = "failed";
  job.error = "Cancelled by user";
  job.completedAt = /* @__PURE__ */ new Date();
  await saveJobToDb(job);
  activeJobs.delete(id);
  sendToRenderer("job:failed", { id, error: "Cancelled by user" });
  return true;
}
class FileController {
  async createFile(fileData) {
    if (!fileData) {
      throw new Error("File data is required");
    }
    const db2 = getDb();
    const [newFile] = await db2.insert(files).values(fileData).returning();
    return newFile;
  }
  async getFileById(id) {
    const db2 = getDb();
    const [file] = await db2.select().from(files).where(drizzleOrm.eq(files.id, id));
    return file;
  }
  async getAllFiles() {
    const db2 = getDb();
    return await db2.select().from(files);
  }
  async updateFilePath(id, newPath) {
    const db2 = getDb();
    const [updated] = await db2.update(files).set({ currentPath: newPath, updatedAt: /* @__PURE__ */ new Date() }).where(drizzleOrm.eq(files.id, id)).returning();
    return updated;
  }
  async logOperation(action, fileId, metadata) {
    const db2 = getDb();
    const [logEntry] = await db2.insert(logs).values({
      action,
      fileId,
      metadata
    }).returning();
    return logEntry;
  }
  async getFileHistory(fileId) {
    const db2 = getDb();
    return await db2.select().from(logs).where(drizzleOrm.eq(logs.fileId, fileId)).orderBy(drizzleOrm.desc(logs.timestamp));
  }
  async getRecentOperations(limit = 10) {
    const db2 = getDb();
    const recentLogs = await db2.select({
      id: logs.id,
      action: logs.action,
      fileId: logs.fileId,
      timestamp: logs.timestamp,
      metadata: logs.metadata,
      fileName: files.name,
      category: files.category,
      originalPath: files.originalPath,
      currentPath: files.currentPath
    }).from(logs).leftJoin(files, drizzleOrm.eq(logs.fileId, files.id)).orderBy(drizzleOrm.desc(logs.timestamp)).limit(limit);
    return recentLogs;
  }
  async findDuplicatesByHash(hash) {
    const db2 = getDb();
    const duplicates = await db2.select().from(files).where(drizzleOrm.eq(files.hash, hash));
    return duplicates;
  }
  async getAllDuplicates() {
    const db2 = getDb();
    const result = await db2.select({
      hash: files.hash,
      count: drizzleOrm.sql`count(*)`.as("count")
    }).from(files).where(drizzleOrm.isNotNull(files.hash)).groupBy(files.hash).having(drizzleOrm.sql`count(*) > 1`);
    const duplicateGroups = [];
    for (const { hash } of result) {
      const fileList = await this.findDuplicatesByHash(hash);
      duplicateGroups.push({
        hash,
        files: fileList,
        count: fileList.length
      });
    }
    return duplicateGroups;
  }
  async undoFileMove(fileId) {
    const db2 = getDb();
    try {
      const file = await this.getFileById(fileId);
      if (!file) {
        return { success: false, error: "File not found" };
      }
      if (file.originalPath === file.currentPath) {
        return { success: true, skipped: true };
      }
      const originalDir = path.dirname(file.originalPath);
      await promises.mkdir(originalDir, { recursive: true });
      try {
        await promises.access(file.currentPath);
      } catch {
        try {
          await promises.access(file.originalPath);
          await db2.update(files).set({
            currentPath: file.originalPath,
            updatedAt: /* @__PURE__ */ new Date(),
            organizedAt: null
          }).where(drizzleOrm.eq(files.id, fileId));
          return { success: true, skipped: true };
        } catch {
          return { success: false, error: "File not found at current or original path" };
        }
      }
      await promises.rename(file.currentPath, file.originalPath);
      await db2.update(files).set({
        currentPath: file.originalPath,
        updatedAt: /* @__PURE__ */ new Date(),
        organizedAt: null
      }).where(drizzleOrm.eq(files.id, fileId));
      await this.logOperation(
        "undone",
        fileId,
        JSON.stringify({
          previousPath: file.currentPath,
          restoredPath: file.originalPath
        })
      );
      return { success: true };
    } catch (error) {
      log.error("Failed to undo file move:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async undoRecentOrganization(options) {
    const db2 = getDb();
    const errors = [];
    let undoneCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const since = options?.since || new Date(Date.now() - 24 * 60 * 60 * 1e3);
    const organizedFiles = await db2.select().from(files).where(drizzleOrm.and(drizzleOrm.isNotNull(files.organizedAt), drizzleOrm.gte(files.organizedAt, since))).limit(options?.limit || 1e3);
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
      errors
    };
  }
  async getUndoableFiles(since) {
    const db2 = getDb();
    const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1e3);
    const undoableFiles = await db2.select({
      id: files.id,
      name: files.name,
      originalPath: files.originalPath,
      currentPath: files.currentPath,
      category: files.category,
      organizedAt: files.organizedAt
    }).from(files).where(drizzleOrm.and(drizzleOrm.isNotNull(files.organizedAt), drizzleOrm.gte(files.organizedAt, sinceDate)));
    const filteredFiles = undoableFiles.filter(
      (f) => f.currentPath !== f.originalPath
    );
    return {
      files: filteredFiles,
      count: filteredFiles.length
    };
  }
}
const fileController = new FileController();
function registerFileHandlers() {
  electron.ipcMain.handle("files:scan", async (_, path2) => {
    try {
      return await scanInfo(path2);
    } catch (error) {
      log.error("Failed to scan files:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("files:classify", async (_, path2) => {
    try {
      const scanResult = await scanInfo(path2);
      const categorized = classifyFiles(scanResult.files);
      const categories = {};
      for (const [category, files2] of categorized) {
        categories[category] = files2;
      }
      return {
        totalFiles: scanResult.totalFiles,
        scannedPath: scanResult.scannedPath,
        scannedAt: scanResult.scannedAt,
        categories
      };
    } catch (error) {
      log.error("Failed to classify files:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("files:organize", async (_, { sourcePath, targetPath }) => {
    try {
      const job = await createJob("organize", { sourcePath, targetPath });
      return {
        success: true,
        jobId: job.id,
        status: "queued"
      };
    } catch (error) {
      log.error("Failed to create organize job:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("files:validate-path", async (_, path2) => {
    try {
      const stats = await promises.stat(path2);
      await promises.access(path2, fs.constants.R_OK);
      return {
        valid: true,
        exists: true,
        isDirectory: stats.isDirectory(),
        readable: true
      };
    } catch (error) {
      const err = error;
      return {
        valid: false,
        exists: err.code !== "ENOENT",
        isDirectory: false,
        readable: false,
        error: err.message
      };
    }
  });
  electron.ipcMain.handle("files:undo", async (_, options) => {
    try {
      if (options?.fileId) {
        return await fileController.undoFileMove(options.fileId);
      }
      const since = options?.since ? new Date(options.since) : void 0;
      return await fileController.undoRecentOrganization(since ? { since } : void 0);
    } catch (error) {
      log.error("Failed to undo organization:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("files:undoable", async (_, since) => {
    try {
      const sinceDate = since ? new Date(since) : void 0;
      return await fileController.getUndoableFiles(sinceDate);
    } catch (error) {
      log.error("Failed to get undoable files:", error);
      throw error;
    }
  });
}
function registerHistoryHandlers() {
  electron.ipcMain.handle("history:files", async () => {
    try {
      return await fileController.getAllFiles();
    } catch (error) {
      log.error("Failed to get files:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("history:file", async (_, id) => {
    try {
      const file = await fileController.getFileById(id);
      const history = await fileController.getFileHistory(id);
      return { file, history };
    } catch (error) {
      log.error("Failed to get file:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("history:operations", async (_, limit) => {
    try {
      return await fileController.getRecentOperations(limit || 10);
    } catch (error) {
      log.error("Failed to get operations:", error);
      throw error;
    }
  });
}
function registerDuplicateHandlers() {
  electron.ipcMain.handle("duplicates:list", async () => {
    try {
      const duplicates = await fileController.getAllDuplicates();
      return {
        success: true,
        count: duplicates.length,
        duplicates
      };
    } catch (error) {
      log.error("Failed to get duplicates:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("duplicates:scan", async (_, sourcePath) => {
    try {
      const job = await createJob("duplicate", { sourcePath });
      return {
        success: true,
        jobId: job.id,
        status: "queued"
      };
    } catch (error) {
      log.error("Failed to create duplicate scan job:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("duplicates:file", async (_, fileId) => {
    try {
      const file = await fileController.getFileById(fileId);
      if (!file) {
        return { success: false, error: "File not found" };
      }
      if (!file.hash) {
        return { success: false, error: "File has no hash" };
      }
      const duplicates = await fileController.findDuplicatesByHash(file.hash);
      return {
        success: true,
        originalFile: file,
        duplicates: duplicates.filter((d) => d.id !== fileId),
        count: duplicates.length - 1
      };
    } catch (error) {
      log.error("Failed to find file duplicates:", error);
      throw error;
    }
  });
}
function registerJobHandlers() {
  electron.ipcMain.handle("jobs:get", async (_, id) => {
    try {
      const job = await getJob(id);
      if (!job) {
        return { success: false, error: "Job not found" };
      }
      return {
        success: true,
        job: {
          id: job.id,
          name: job.type,
          queue: job.type,
          state: job.status,
          progress: job.progress,
          data: job.data,
          result: job.result,
          processedOn: job.startedAt?.getTime(),
          finishedOn: job.completedAt?.getTime(),
          failedReason: job.error,
          timestamp: job.createdAt.getTime()
        }
      };
    } catch (error) {
      log.error("Failed to get job:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("jobs:organize:list", async () => {
    try {
      const jobs2 = await getJobsByType("organize");
      return {
        success: true,
        count: jobs2.length,
        jobs: jobs2.map((job) => ({
          id: job.id,
          name: job.type,
          state: job.status,
          progress: job.progress,
          data: job.data,
          result: job.result,
          timestamp: job.createdAt.getTime(),
          processedOn: job.startedAt?.getTime(),
          finishedOn: job.completedAt?.getTime(),
          failedReason: job.error
        }))
      };
    } catch (error) {
      log.error("Failed to list organize jobs:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("jobs:duplicate:list", async () => {
    try {
      const jobs2 = await getJobsByType("duplicate");
      return {
        success: true,
        count: jobs2.length,
        jobs: jobs2.map((job) => ({
          id: job.id,
          name: job.type,
          state: job.status,
          progress: job.progress,
          data: job.data,
          result: job.result,
          timestamp: job.createdAt.getTime(),
          processedOn: job.startedAt?.getTime(),
          finishedOn: job.completedAt?.getTime(),
          failedReason: job.error
        }))
      };
    } catch (error) {
      log.error("Failed to list duplicate jobs:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("jobs:cancel", async (_, id) => {
    try {
      const cancelled = await cancelJob(id);
      return { success: cancelled };
    } catch (error) {
      log.error("Failed to cancel job:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("jobs:logs", async (_, id) => {
    try {
      const job = await getJob(id);
      return job ? job.logs : [];
    } catch (error) {
      log.error("Failed to get job logs:", error);
      throw error;
    }
  });
}
const downloadsPath = electron.app.getPath("downloads");
const documentsPath = electron.app.getPath("documents");
const schedules = {
  // Daily organize downloads at 2 AM
  autoOrganizeDownloads: {
    pattern: "0 2 * * *",
    enabled: false,
    // Disabled by default - user should configure paths
    timezone: "UTC",
    config: {
      sourcePath: downloadsPath,
      targetPath: path.join(documentsPath, "Organized Files")
    }
  },
  // Weekly duplicate scan on Sunday at 3 AM
  weeklyDuplicateScan: {
    pattern: "0 3 * * 0",
    enabled: false,
    timezone: "UTC",
    config: {
      sourcePath: path.join(documentsPath, "Organized Files")
    }
  },
  // Daily cleanup of old jobs at midnight
  dailyJobCleanup: {
    pattern: "0 0 * * *",
    enabled: true,
    timezone: "UTC",
    config: {
      daysToKeep: 7
    }
  },
  // Test schedule (every minute) - disabled
  testSchedule: {
    pattern: "* * * * *",
    enabled: false,
    timezone: "UTC",
    config: {
      sourcePath: "",
      targetPath: ""
    }
  }
};
const activeTasks = /* @__PURE__ */ new Map();
const scheduleHandlers = {
  autoOrganizeDownloads: async () => {
    const config2 = schedules.autoOrganizeDownloads.config;
    log.info({ config: config2 }, "Running scheduled organize task");
    try {
      await createJob("organize", {
        sourcePath: config2.sourcePath,
        targetPath: config2.targetPath
      });
      log.info("Scheduled organize job created");
    } catch (error) {
      log.error("Failed to create scheduled organize job:", error);
    }
  },
  weeklyDuplicateScan: async () => {
    const config2 = schedules.weeklyDuplicateScan.config;
    log.info({ config: config2 }, "Running weekly duplicate scan");
    try {
      await createJob("duplicate", {
        sourcePath: config2.sourcePath
      });
      log.info("Scheduled duplicate scan created");
    } catch (error) {
      log.error("Failed to create scheduled duplicate job:", error);
    }
  },
  dailyJobCleanup: async () => {
    const config2 = schedules.dailyJobCleanup.config;
    log.info({ config: config2 }, "Running daily job cleanup");
    log.info("Job cleanup completed");
  },
  testSchedule: async () => {
    log.info("Test schedule triggered");
  }
};
function startSchedule(name) {
  const schedule = schedules[name];
  if (!schedule.enabled) {
    log.warn(`Schedule '${name}' is disabled`);
    return false;
  }
  if (activeTasks.has(name)) {
    log.warn(`Schedule '${name}' is already running`);
    return false;
  }
  const handler = scheduleHandlers[name];
  if (!handler) {
    log.error(`No handler for schedule '${name}'`);
    return false;
  }
  const task = cron.schedule(
    schedule.pattern,
    async () => {
      log.info(`⏰ Running scheduled task: ${name}`);
      try {
        await handler();
      } catch (error) {
        log.error(`Scheduled task '${name}' failed:`, error);
      }
    },
    {
      timezone: schedule.timezone
    }
  );
  activeTasks.set(name, task);
  log.info(`✅ Schedule '${name}' started (${schedule.pattern})`);
  return true;
}
function stopSchedule(name) {
  const task = activeTasks.get(name);
  if (!task) {
    log.warn(`Schedule '${name}' is not running`);
    return false;
  }
  task.stop();
  activeTasks.delete(name);
  log.info(`🛑 Schedule '${name}' stopped`);
  return true;
}
async function triggerSchedule(name) {
  const handler = scheduleHandlers[name];
  if (!handler) {
    throw new Error(`No handler for schedule '${name}'`);
  }
  log.info(`🔄 Manually triggering schedule: ${name}`);
  await handler();
}
function getScheduleStatus() {
  return Object.entries(schedules).map(([name, schedule]) => ({
    name,
    pattern: schedule.pattern,
    enabled: schedule.enabled,
    running: activeTasks.has(name),
    config: schedule.config
  }));
}
function startAllSchedules() {
  log.info("🚀 Starting all enabled schedules...");
  for (const name of Object.keys(schedules)) {
    if (schedules[name].enabled) {
      try {
        startSchedule(name);
      } catch (error) {
        log.warn(`Failed to start schedule '${name}':`, error);
      }
    }
  }
}
function stopAllSchedules() {
  log.info("🛑 Stopping all schedules...");
  for (const [name, task] of activeTasks.entries()) {
    task.stop();
    log.info(`Stopped schedule: ${name}`);
  }
  activeTasks.clear();
}
function registerScheduleHandlers() {
  electron.ipcMain.handle("schedules:list", async () => {
    try {
      const status = getScheduleStatus();
      return {
        success: true,
        count: status.length,
        schedules: status
      };
    } catch (error) {
      log.error("Failed to get schedules:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("schedules:start", async (_, name) => {
    try {
      if (!(name in schedules)) {
        return { success: false, error: "Schedule not found" };
      }
      const started = startSchedule(name);
      if (!started) {
        return { success: false, error: "Schedule already running or disabled" };
      }
      return { success: true, message: `Schedule '${name}' started` };
    } catch (error) {
      log.error("Failed to start schedule:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("schedules:stop", async (_, name) => {
    try {
      if (!(name in schedules)) {
        return { success: false, error: "Schedule not found" };
      }
      const stopped = stopSchedule(name);
      if (!stopped) {
        return { success: false, error: "Schedule not running" };
      }
      return { success: true, message: `Schedule '${name}' stopped` };
    } catch (error) {
      log.error("Failed to stop schedule:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("schedules:trigger", async (_, name) => {
    try {
      if (!(name in schedules)) {
        return { success: false, error: "Schedule not found" };
      }
      await triggerSchedule(name);
      return { success: true, message: `Schedule '${name}' triggered` };
    } catch (error) {
      log.error("Failed to trigger schedule:", error);
      throw error;
    }
  });
}
function registerDialogHandlers() {
  electron.ipcMain.handle("dialog:select-directory", async () => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: "Select Folder"
    });
    return result.canceled ? null : result.filePaths[0];
  });
  electron.ipcMain.handle("dialog:select-file", async (_, filters) => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openFile"],
      title: "Select File",
      filters: filters || [{ name: "All Files", extensions: ["*"] }]
    });
    return result.canceled ? null : result.filePaths[0];
  });
  electron.ipcMain.handle("dialog:show-message", async (_, options) => {
    return electron.dialog.showMessageBox({
      type: options.type,
      title: options.title,
      message: options.message,
      buttons: ["OK"]
    });
  });
  electron.ipcMain.handle("dialog:confirm", async (_, options) => {
    const result = await electron.dialog.showMessageBox({
      type: "question",
      title: options.title || "Confirm",
      message: options.message,
      buttons: ["Yes", "No"],
      defaultId: 0,
      cancelId: 1
    });
    return result.response === 0;
  });
}
log.transports.file.level = "info";
log.transports.console.level = utils.is.dev ? "debug" : "info";
utils.electronApp.setAppUserModelId("com.filemanager.desktop");
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    icon: path.join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
    if (!utils.is.dev) {
      electronUpdater.autoUpdater.checkForUpdatesAndNotify();
    }
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  if (utils.is.dev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}
function registerAllHandlers() {
  registerFileHandlers();
  registerHistoryHandlers();
  registerDuplicateHandlers();
  registerJobHandlers();
  registerScheduleHandlers();
  registerDialogHandlers();
  electron.ipcMain.handle("app:version", () => electron.app.getVersion());
  electron.ipcMain.handle("app:platform", () => process.platform);
  electron.ipcMain.handle("app:userData", () => electron.app.getPath("userData"));
  log.info("✅ All IPC handlers registered");
}
electronUpdater.autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info.version);
  mainWindow?.webContents.send("update:available", info);
});
electronUpdater.autoUpdater.on("update-downloaded", (info) => {
  log.info("Update downloaded:", info.version);
  mainWindow?.webContents.send("update:downloaded", info);
  electron.dialog.showMessageBox({
    type: "info",
    title: "Update Ready",
    message: `Version ${info.version} has been downloaded. Restart to apply the update?`,
    buttons: ["Restart", "Later"]
  }).then((result) => {
    if (result.response === 0) {
      electronUpdater.autoUpdater.quitAndInstall();
    }
  });
});
electronUpdater.autoUpdater.on("error", (error) => {
  log.error("Auto-updater error:", error);
});
electron.app.whenReady().then(async () => {
  log.info("🚀 Starting File Manager Desktop v" + electron.app.getVersion());
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  try {
    await initDatabase();
    log.info("✅ Database initialized");
    registerAllHandlers();
    startAllSchedules();
    log.info("✅ Schedules started");
    createWindow();
    electron.app.on("activate", () => {
      if (electron.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    log.error("❌ Failed to initialize app:", error);
    electron.dialog.showErrorBox(
      "Initialization Error",
      `Failed to start File Manager: ${error instanceof Error ? error.message : String(error)}`
    );
    electron.app.quit();
  }
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("before-quit", () => {
  log.info("🛑 Shutting down File Manager...");
  stopAllSchedules();
});
process.on("uncaughtException", (error) => {
  log.error("Uncaught exception:", error);
});
process.on("unhandledRejection", (reason) => {
  log.error("Unhandled rejection:", reason);
});

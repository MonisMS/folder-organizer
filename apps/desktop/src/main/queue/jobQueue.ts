import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';
import log from 'electron-log';
import { getDb } from '../db';
import { jobs } from '../db/schema';
import { eq } from 'drizzle-orm';

// Job types
export interface JobData {
  sourcePath: string;
  targetPath?: string;
}

export interface JobResult {
  totalFiles?: number;
  movedFiles?: number;
  failedFiles?: number;
  duplicateGroups?: number;
  errors?: string[];
  [key: string]: unknown;
}

export interface Job {
  id: string;
  type: 'organize' | 'duplicate';
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  data: JobData;
  result?: JobResult;
  error?: string;
  logs: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// Job event emitter
export const jobEvents = new EventEmitter();

// In-memory job registry (also persisted to SQLite)
const activeJobs = new Map<string, Job>();

// Job processor type
type JobProcessor = (
  job: Job,
  updateProgress: (progress: number) => void,
  addLog: (message: string) => void
) => Promise<JobResult>;

// Registered processors
const processors: Record<string, JobProcessor> = {};

// Generate unique job ID
function generateJobId(type: string): string {
  const prefix = type === 'organize' ? 'org' : 'dup';
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Send event to renderer
function sendToRenderer(channel: string, data: unknown): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, data);
  });
}

// Create a new job
export async function createJob(
  type: 'organize' | 'duplicate',
  data: JobData
): Promise<Job> {
  const id = generateJobId(type);
  const db = getDb();

  const job: Job = {
    id,
    type,
    status: 'waiting',
    progress: 0,
    data,
    logs: [],
    createdAt: new Date(),
  };

  // Save to database
  await db.insert(jobs).values({
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    data: JSON.stringify(job.data),
    logs: JSON.stringify(job.logs),
    createdAt: job.createdAt,
  });

  // Add to active jobs
  activeJobs.set(id, job);

  log.info(`📋 Job created: ${id} (${type})`);

  // Process job asynchronously
  processJob(job);

  return job;
}

// Process a job
async function processJob(job: Job): Promise<void> {
  const processor = processors[job.type];
  
  if (!processor) {
    log.error(`No processor registered for job type: ${job.type}`);
    await updateJobStatus(job.id, 'failed', undefined, 'No processor found');
    return;
  }

  // Update status to active
  job.status = 'active';
  job.startedAt = new Date();
  await saveJobToDb(job);

  sendToRenderer('job:active', { id: job.id });
  log.info(`▶️ Job started: ${job.id}`);

  // Progress updater
  const updateProgress = async (progress: number): Promise<void> => {
    job.progress = progress;
    await saveJobToDb(job);
    sendToRenderer('job:progress', { id: job.id, progress });
  };

  // Log adder
  const addLog = async (message: string): Promise<void> => {
    job.logs.push(`[${new Date().toISOString()}] ${message}`);
    await saveJobToDb(job);
  };

  try {
    const result = await processor(job, updateProgress, addLog);
    
    job.status = 'completed';
    job.progress = 100;
    job.result = result;
    job.completedAt = new Date();
    await saveJobToDb(job);

    sendToRenderer('job:completed', { id: job.id, result });
    log.info(`✅ Job completed: ${job.id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    job.status = 'failed';
    job.error = errorMessage;
    job.completedAt = new Date();
    await saveJobToDb(job);

    sendToRenderer('job:failed', { id: job.id, error: errorMessage });
    log.error(`❌ Job failed: ${job.id}`, error);
  }
}

// Save job to database
async function saveJobToDb(job: Job): Promise<void> {
  const db = getDb();
  
  await db.update(jobs)
    .set({
      status: job.status,
      progress: job.progress,
      result: job.result ? JSON.stringify(job.result) : null,
      error: job.error,
      logs: JSON.stringify(job.logs),
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    })
    .where(eq(jobs.id, job.id));
}

// Update job status
async function updateJobStatus(
  id: string,
  status: Job['status'],
  result?: JobResult,
  error?: string
): Promise<void> {
  const job = activeJobs.get(id);
  if (!job) return;

  job.status = status;
  if (result) job.result = result;
  if (error) job.error = error;
  if (status === 'completed' || status === 'failed') {
    job.completedAt = new Date();
  }

  await saveJobToDb(job);
}

// Get job by ID
export async function getJob(id: string): Promise<Job | null> {
  // Check active jobs first
  const activeJob = activeJobs.get(id);
  if (activeJob) return activeJob;

  // Load from database
  const db = getDb();
  const [dbJob] = await db.select().from(jobs).where(eq(jobs.id, id));
  
  if (!dbJob) return null;

  return {
    id: dbJob.id,
    type: dbJob.type as 'organize' | 'duplicate',
    status: dbJob.status as Job['status'],
    progress: dbJob.progress || 0,
    data: dbJob.data ? JSON.parse(dbJob.data) : {},
    result: dbJob.result ? JSON.parse(dbJob.result) : undefined,
    error: dbJob.error || undefined,
    logs: dbJob.logs ? JSON.parse(dbJob.logs) : [],
    createdAt: dbJob.createdAt,
    startedAt: dbJob.startedAt || undefined,
    completedAt: dbJob.completedAt || undefined,
  };
}

// Get all jobs of a type
export async function getJobsByType(type: 'organize' | 'duplicate'): Promise<Job[]> {
  const db = getDb();
  const dbJobs = await db.select().from(jobs).where(eq(jobs.type, type));
  
  return dbJobs.map((dbJob) => ({
    id: dbJob.id,
    type: dbJob.type as 'organize' | 'duplicate',
    status: dbJob.status as Job['status'],
    progress: dbJob.progress || 0,
    data: dbJob.data ? JSON.parse(dbJob.data) : {},
    result: dbJob.result ? JSON.parse(dbJob.result) : undefined,
    error: dbJob.error || undefined,
    logs: dbJob.logs ? JSON.parse(dbJob.logs) : [],
    createdAt: dbJob.createdAt,
    startedAt: dbJob.startedAt || undefined,
    completedAt: dbJob.completedAt || undefined,
  }));
}

// Cancel a job (if still waiting)
export async function cancelJob(id: string): Promise<boolean> {
  const job = activeJobs.get(id);
  
  if (!job || job.status !== 'waiting') {
    return false;
  }

  job.status = 'failed';
  job.error = 'Cancelled by user';
  job.completedAt = new Date();
  await saveJobToDb(job);
  
  activeJobs.delete(id);
  sendToRenderer('job:failed', { id, error: 'Cancelled by user' });
  
  return true;
}

// Register a job processor
export function registerProcessor(type: string, processor: JobProcessor): void {
  processors[type] = processor;
  log.info(`📝 Registered processor for job type: ${type}`);
}

// Export for convenience
export { activeJobs };

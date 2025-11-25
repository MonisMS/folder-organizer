import type { FastifyInstance } from 'fastify';
import { classifyFiles } from '../services/fileClassifier.js';
import { moveFile } from '../services/fileMover.js';
import { config } from '../config/index.js';
import type { FileInfo } from '@file-manager/shared';
import { scanInfo } from '../services/scannerInfo.js';
import { logger } from '../lib/logger.js';
import { organizeQueue } from '../queues/fileQueue.js';
import { fileController } from '../controller/fileController.js';
import fs from 'fs/promises';
import path from 'path';



interface ClassifyQuery {
  path: string;
}

interface OrganizeRequest {
  sourcePath: string;
  dryRun?: boolean;
}

interface OrganizeResponse {
  totalFiles: number;
  movedFiles: number;
  failedFiles: number;
  results: {
    category: string;
    files: string[];
  }[];
  errors: string[];
}

interface ValidatePathBody {
  path: string;
}

export async function fileRoutes(fastify: FastifyInstance) {
  
  fastify.post<{ Body: ValidatePathBody }>('/validate-path', async (request, reply) => {
    const { path: dirPath } = request.body;

    if (!dirPath) {
      return reply.status(400).send({ error: 'Path is required' });
    }

    try {
      const stats = await fs.stat(dirPath);
      
      // Check read permissions
      await fs.access(dirPath, fs.constants.R_OK);

      return {
        valid: true,
        exists: true,
        isDirectory: stats.isDirectory(),
        readable: true
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {
          valid: false,
          exists: false,
          isDirectory: false,
          readable: false,
          error: 'Path does not exist'
        };
      }
      
      return {
        valid: false,
        exists: true, // Assume exists if error is not ENOENT (e.g. EACCES)
        isDirectory: false,
        readable: false,
        error: error.message || 'Validation failed'
      };
    }
  });
  
  fastify.get<{ Querystring: ClassifyQuery }>('/classify', async (request, reply) => {
    const { path } = request.query;
    
    // Validate input
    if (!path) {
      return reply.status(400).send({ 
        error: 'path query parameter is required' 
      });
    }
    
    try {
      
      fastify.log.info({ path }, 'Scanning folder for classification');
      const scanResult = await scanInfo(path);
      
   
      const categorized = classifyFiles(scanResult.files);
      
      
      const categories: Record<string, FileInfo[]> = {};
      
      for (const [category, files] of categorized) {
        categories[category] = files;
      }
      
      return {
        totalFiles: scanResult.totalFiles,
        scannedPath: scanResult.scannedPath,
        scannedAt: scanResult.scannedAt,
        categories,
      };
      
    } catch (error) {
      fastify.log.error({ error, path }, 'Failed to classify files');
      
      return reply.status(500).send({ 
        error: 'Failed to classify files',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

 
  
  fastify.post<{
    Body: { sourcePath: string; targetPath: string };
  }>('/organize', async (request, reply) => {
    try {
      const { sourcePath, targetPath } = request.body;

      if (!sourcePath || !targetPath) {
        return reply.status(400).send({
          success: false,
          error: 'sourcePath and targetPath are required',
        });
      }

      // Add job to queue instead of processing directly
      const job = await organizeQueue.add(
        'organize-files',
        { sourcePath, targetPath },
        {
          // Job-specific options (override defaults)
          priority: 1, // Higher priority = processed first
        }
      );

      logger.info({ jobId: job.id, sourcePath, targetPath }, 'Organize job created');

      // Return job ID immediately
      return {
        success: true,
        message: 'File organization job created',
        jobId: job.id,
        status: 'queued',
        // Poll this endpoint to check status:
        statusUrl: `/api/jobs/${job.id}`,
      };
      
    } catch (error) {
      logger.error({ error }, 'Failed to create organize job');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create job',
      });
    }
  });

  // Undo recent organization
  fastify.post<{
    Body: { since?: string; fileId?: number };
  }>('/undo', async (request, reply) => {
    try {
      const { since, fileId } = request.body;

      // If specific file ID provided, undo just that file
      if (fileId) {
        const result = await fileController.undoFileMove(fileId);
        if (!result.success) {
          return reply.status(400).send({
            success: false,
            error: result.error
          });
        }
        return {
          success: true,
          message: 'File restored to original location',
          undoneCount: 1,
          failedCount: 0,
          errors: []
        };
      }

      // Otherwise, undo all recent files
      const sinceDate = since ? new Date(since) : undefined;
      const result = await fileController.undoRecentOrganization(sinceDate ? { since: sinceDate } : undefined);

      logger.info({ result }, 'Undo operation completed');

      return {
        success: result.success,
        message: `Restored ${result.undoneCount} files to original locations`,
        undoneCount: result.undoneCount,
        failedCount: result.failedCount,
        errors: result.errors
      };

    } catch (error) {
      logger.error({ error }, 'Undo operation failed');
      return reply.status(500).send({
        success: false,
        error: 'Failed to undo organization'
      });
    }
  });

  // Get files that can be undone
  fastify.get<{
    Querystring: { since?: string };
  }>('/undoable', async (request) => {
    const { since } = request.query;
    const sinceDate = since ? new Date(since) : undefined;
    
    const undoableFiles = await fileController.getUndoableFiles(sinceDate);
    
    return {
      files: undoableFiles,
      count: undoableFiles.length
    };
  });
}
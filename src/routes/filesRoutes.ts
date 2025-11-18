import type { FastifyInstance } from 'fastify';
import { classifyFiles } from '../services/fileClassifier.js';
import { moveFile } from '../services/fileMover.js';
import { config } from '../config/index.js';
import type { FileInfo } from '../types/type.js';
import { scanInfo } from '../services/scannerInfo.js';

// ============================================
// Type Definitions
// ============================================

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



export async function fileRoutes(fastify: FastifyInstance) {
  

  
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

 
  
  fastify.post<{ Body: OrganizeRequest }>('/organize', async (request, reply) => {
    const { sourcePath, dryRun = false } = request.body;
    
    // Validate input
    if (!sourcePath) {
      return reply.status(400).send({ 
        error: 'sourcePath is required in request body' 
      });
    }
    
    try {
      // Step 1: Scan folder
      fastify.log.info({ sourcePath, dryRun }, 'Starting file organization');
      const scanResult = await scanInfo(sourcePath);
      
      // Step 2: Classify files
      const categorized = classifyFiles(scanResult.files);
      
      // Step 3: Initialize tracking arrays
      const movedFiles: string[] = [];
      const errors: string[] = [];
      const results: { category: string; files: string[] }[] = [];
      
      // Step 4: Process each category
      for (const [category, files] of categorized) {
        const categoryFiles: string[] = [];
        
        fastify.log.info(
          { category, fileCount: files.length }, 
          `Processing category: ${category}`
        );
        
        // Step 5: Move each file in this category
        for (const file of files) {
          try {
            if (!dryRun) {
              // Actually move the file
              const moveResult = await moveFile(
                file, 
                category, 
                config.organizedRoot
              );
              
              if (moveResult.success) {
                movedFiles.push(file.name);
                categoryFiles.push(file.name);
                
                fastify.log.info(
                  { file: file.name, to: moveResult.newPath },
                  'File moved successfully'
                );
              } else {
                const errorMsg = `Failed to move ${file.name}: ${moveResult.error}`;
                errors.push(errorMsg);
                
                fastify.log.warn({ file: file.name, error: moveResult.error }, errorMsg);
              }
            } else {
              // Dry run - just track what would be moved
              categoryFiles.push(file.name);
            }
          } catch (error) {
            const errorMsg = error instanceof Error 
              ? error.message 
              : 'Unknown error';
            
            errors.push(`Error moving ${file.name}: ${errorMsg}`);
            
            fastify.log.error(
              { error, file: file.name },
              'Failed to move file'
            );
          }
        }
        
        // Add category results
        results.push({
          category,
          files: categoryFiles,
        });
      }
      
      // Step 6: Build and return response
      const response: OrganizeResponse = {
        totalFiles: scanResult.totalFiles,
        movedFiles: movedFiles.length,
        failedFiles: errors.length,
        results,
        errors,
      };
      
      fastify.log.info(
        { 
          totalFiles: response.totalFiles,
          movedFiles: response.movedFiles,
          failedFiles: response.failedFiles 
        },
        'File organization completed'
      );
      
      return response;
      
    } catch (error) {
      fastify.log.error({ error, sourcePath }, 'Failed to organize files');
      
      return reply.status(500).send({ 
        error: 'Failed to organize files',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
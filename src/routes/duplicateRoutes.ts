import type { FastifyInstance } from "fastify";
import { fileController } from "../controller/fileController.js";
import { logger } from "../lib/logger.js";
import { scanInfo } from "../services/scannerInfo.js";
import { findDuplicates } from "../services/hashService.js";

export async function duplicateRoutes(fastify: FastifyInstance) {
  // Get all duplicates from database
  fastify.get('/duplicates', async (request, reply) => {
    try {
      const duplicates = await fileController.getAllDuplicates();
      return {
        success: true,
        count: duplicates.length,
        duplicates,
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching duplicates');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch duplicates',
      });
    }
  });

  // Scan directory for duplicates
  fastify.post<{
    Body: { sourcePath: string };
  }>('/scan', async (request, reply) => {
    try {
      const { sourcePath } = request.body;

      if (!sourcePath) {
        return reply.status(400).send({
          success: false,
          error: 'sourcePath is required',
        });
      }

      // Scan directory
      logger.info({ sourcePath }, 'Scanning for duplicates');
      const scanResult = await scanInfo(sourcePath);

      // Find duplicates
      const duplicates = await findDuplicates(
        scanResult.files.map(f => ({ path: f.path, name: f.name }))
      );

      // Format response
      const duplicateGroups = Array.from(duplicates.entries()).map(([hash, fileList]) => ({
        hash,
        count: fileList.length,
        totalSize: fileList.reduce((sum, f) => {
          const file = scanResult.files.find(x => x.path === f.path);
          return sum + (file?.size || 0);
        }, 0),
        files: fileList,
      }));

      const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0);
      const wastedSpace = duplicateGroups.reduce(
        (sum, g) => sum + (g.totalSize * (g.count - 1)), 
        0
      );

      return {
        success: true,
        scannedFiles: scanResult.files.length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates,
        wastedSpace,
        duplicates: duplicateGroups,
      };
    } catch (error) {
      logger.error({ error }, 'Error scanning for duplicates');
      return reply.status(500).send({
        success: false,
        error: 'Failed to scan for duplicates',
      });
    }
  });

  // Find duplicates of a specific file
  fastify.get<{
    Params: { id: string };
  }>('/file/:id', async (request, reply) => {
    try {
      const fileId = parseInt(request.params.id);

      if (isNaN(fileId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid file ID',
        });
      }

      // Get the file
      const file = await fileController.getFileById(fileId);
      
      if (!file) {
        return reply.status(404).send({
          success: false,
          error: 'File not found',
        });
      }

      if (!file.hash) {
        return reply.status(404).send({
          success: false,
          error: 'File has no hash (not scanned for duplicates yet)',
        });
      }

      // Find all files with same hash
      const duplicates = await fileController.findDuplicatesByHash(file.hash);

      return {
        success: true,
        originalFile: file,
        duplicates: duplicates.filter(d => d.id !== fileId),
        count: duplicates.length - 1,
      };
    } catch (error) {
      logger.error({ error }, 'Error finding file duplicates');
      return reply.status(500).send({
        success: false,
        error: 'Failed to find duplicates',
      });
    }
  });
}
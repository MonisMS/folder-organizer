import type { FastifyInstance } from 'fastify';
import { fileController } from '../controller/fileController.js';
export async function historyRoutes(fastify: FastifyInstance) {
  // Get all files
  fastify.get('/files', async () => {
    return await fileController.getAllFiles();
  });

  // Get file by ID with history
  fastify.get('/files/:id', async (request) => {
    const { id } = request.params as { id: string };
    const file = await fileController.getFileById(Number(id));
    const history = await fileController.getFileHistory(Number(id));
    
    return { file, history };
  });

  // Get recent operations
  fastify.get('/operations', async (request) => {
    const { limit } = request.query as { limit?: string };
    return await fileController.getRecentOperations(
      limit ? Number(limit) : 10
    );
  });
}
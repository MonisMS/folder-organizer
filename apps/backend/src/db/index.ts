import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';
import 'dotenv/config';
import { logger } from '../lib/logger.js';

if (!process.env.DATABASE_URL) {
  const error = new Error('DATABASE_URL environment variable is not set');
  logger.error({ error }, 'Database configuration error');
  throw error;
}

let db;
try {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
  logger.info('✅ Database connection initialized');
} catch (error) {
  logger.error({ error }, '❌ Failed to initialize database connection');
  throw error;
}

export { db };
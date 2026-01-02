import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// Files table - tracks all scanned and organized files
export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  originalPath: text('original_path').notNull(),
  currentPath: text('current_path').notNull(),
  size: integer('size').notNull(),
  extension: text('extension').notNull(),
  category: text('category'),
  hash: text('hash'),
  scannedAt: integer('scanned_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  organizedAt: integer('organized_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  hashIdx: index('hash_idx').on(table.hash),
  categoryIdx: index('category_idx').on(table.category),
}));

// Logs table - tracks all file operations for history and undo
export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(), // 'scanned', 'moved', 'deleted', 'undone'
  fileId: integer('file_id').references(() => files.id),
  timestamp: integer('timestamp', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  metadata: text('metadata'), // JSON string with operation details
}, (table) => ({
  actionIdx: index('action_idx').on(table.action),
  timestampIdx: index('timestamp_idx').on(table.timestamp),
}));

// Jobs table - tracks background jobs
export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'organize', 'duplicate'
  status: text('status').notNull(), // 'waiting', 'active', 'completed', 'failed'
  progress: integer('progress').default(0),
  data: text('data'), // JSON string with job input
  result: text('result'), // JSON string with job result
  error: text('error'),
  logs: text('logs'), // JSON array of log messages
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
}, (table) => ({
  statusIdx: index('job_status_idx').on(table.status),
  typeIdx: index('job_type_idx').on(table.type),
}));

// Settings table - app configuration
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Type inference helpers
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Setting = typeof settings.$inferSelect;


import { integer, pgTable, text, timestamp, serial } from "drizzle-orm/pg-core";

// Files table - tracks all scanned and organized files
export const files = pgTable("files", {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    originalPath: text('original_path').notNull(),  // Where file was found
    currentPath: text('current_path').notNull(),    // Where file is now
    size: integer('size').notNull(),                // File size in bytes
    extension: text('extension').notNull(),         // File extension (.pdf, .jpg, etc.)
    category: text('category'),                     // Which category it was organized into
    hash: text('hash'),                             // SHA-256 hash for duplicate detection (Part 4)
    scannedAt: timestamp('scanned_at').defaultNow().notNull(),
    organizedAt: timestamp('organized_at'),         // When it was moved/organized
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Logs table - tracks all file operations for history and undo
export const logs = pgTable("logs", {
    id: serial('id').primaryKey(),
    action: text('action').notNull(),               // 'scanned', 'moved', 'deleted', 'undone'
    fileId: integer('file_id').references(() => files.id),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    metadata: text('metadata'),                     // JSON with operation details (for undo)
});

// Type inference helpers
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
// Application constants

export const APP_NAME = 'File Manager';

// API endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// File size limits
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const CHUNK_SIZE = 1024 * 1024; // 1MB for streaming

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// File categories
export const FILE_CATEGORIES = {
  DOCUMENTS: 'Documents',
  IMAGES: 'Images',
  VIDEOS: 'Videos',
  AUDIO: 'Audio',
  ARCHIVES: 'Archives',
  CODE: 'Code',
  EXECUTABLES: 'Executables',
  OTHER: 'Other',
} as const;

// Job statuses
export const JOB_STATES = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Time constants
export const POLLING_INTERVAL = 5000; // 5 seconds
export const TOAST_DURATION = 4000; // 4 seconds

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'file_manager_token',
  USER: 'file_manager_user',
  THEME: 'file_manager_theme',
} as const;

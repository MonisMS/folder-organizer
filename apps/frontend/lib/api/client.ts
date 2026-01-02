import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

// Error monitoring configuration
const ERROR_MONITORING_ENDPOINT = process.env.NEXT_PUBLIC_ERROR_MONITORING_URL;
const ERROR_MONITORING_ENABLED = isProduction && !!ERROR_MONITORING_ENDPOINT;

// Sensitive headers that should be redacted
const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'x-csrf-token',
  'set-cookie',
];

// Sensitive payload fields that should be redacted
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'creditCard',
  'credit_card',
  'ssn',
  'socialSecurityNumber',
];

interface ErrorContext {
  method?: string;
  url?: string;
  status?: number;
  headers?: Record<string, string>;
  payload?: unknown;
}

interface SanitizedErrorPayload {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

/**
 * Sanitizes headers by redacting sensitive values
 */
function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
  if (!headers) return undefined;
  
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitizes an object by redacting sensitive fields (recursive)
 */
function sanitizePayload(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[MAX_DEPTH_EXCEEDED]'; // Prevent infinite recursion
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizePayload(item, depth + 1));
  }
  
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Error queue for retry mechanism
 */
const errorQueue: SanitizedErrorPayload[] = [];
let isProcessingQueue = false;
const MAX_QUEUE_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Process queued errors with retry logic
 */
async function processErrorQueue(): Promise<void> {
  if (isProcessingQueue || errorQueue.length === 0 || !ERROR_MONITORING_ENDPOINT) return;
  
  isProcessingQueue = true;
  
  while (errorQueue.length > 0) {
    const payload = errorQueue[0];
    let retries = 0;
    let success = false;
    
    while (retries < MAX_RETRIES && !success) {
      try {
        await fetch(ERROR_MONITORING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          // Non-blocking: use keepalive to allow request to complete even if page unloads
          keepalive: true,
        });
        success = true;
      } catch {
        retries++;
        if (retries < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retries));
        }
      }
    }
    
    // Remove from queue regardless of success (to prevent infinite queue growth)
    errorQueue.shift();
  }
  
  isProcessingQueue = false;
}

/**
 * Queue an error for reporting (non-blocking)
 */
function queueError(payload: SanitizedErrorPayload): void {
  if (errorQueue.length >= MAX_QUEUE_SIZE) {
    // Drop oldest errors if queue is full
    errorQueue.shift();
  }
  errorQueue.push(payload);
  
  // Process queue asynchronously (non-blocking)
  setTimeout(() => {
    processErrorQueue().catch(() => {
      // Silently fail - we don't want error reporting to crash the app
    });
  }, 0);
}

/**
 * Try to use Sentry if available
 */
function trySentryCapture(error: unknown, context: ErrorContext): boolean {
  try {
    // Check if Sentry is available (dynamically loaded)
    const Sentry = (globalThis as { Sentry?: { captureException: (e: unknown, opts?: unknown) => void } }).Sentry;
    if (Sentry?.captureException) {
      Sentry.captureException(error, {
        extra: {
          ...context,
          headers: sanitizeHeaders(context.headers),
          payload: sanitizePayload(context.payload),
        },
      });
      return true;
    }
  } catch {
    // Sentry not available or failed
  }
  return false;
}

/**
 * Centralized error monitoring hook.
 * Supports Sentry integration and fallback to backend endpoint.
 * Sanitizes sensitive data and is resilient to failures.
 */
function sendErrorToMonitoring(
  error: unknown,
  context: ErrorContext
): void {
  try {
    // In development, just log to console for debugging
    if (isDevelopment) {
      // Uncomment for detailed debugging:
      // console.error('[ErrorMonitoring]', { error, context });
      return;
    }
    
    // Try Sentry first if available
    if (trySentryCapture(error, context)) {
      return;
    }
    
    // Fallback to backend monitoring endpoint
    if (!ERROR_MONITORING_ENABLED) {
      return;
    }
    
    // Build sanitized payload
    const sanitizedPayload: SanitizedErrorPayload = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        ...context,
        headers: sanitizeHeaders(context.headers),
        payload: sanitizePayload(context.payload),
      },
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
    
    // Queue for non-blocking send with retry
    queueError(sanitizedPayload);
  } catch {
    // Last resort: log to console to avoid crashing the app
    if (isDevelopment) {
      console.error('[ErrorMonitoring] Failed to report error:', error);
    }
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => config,
  (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const method = config?.method?.toUpperCase() ?? 'UNKNOWN';
    const url = config?.url ?? 'UNKNOWN';

    if (isDevelopment) {
      console.error(`[Request Error] ${method} ${url}`, error.message);
    }

    sendErrorToMonitoring(error, {
      method,
      url,
      headers: config?.headers ? Object.fromEntries(Object.entries(config.headers)) : undefined,
    });

    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const method = config?.method?.toUpperCase() ?? 'UNKNOWN';
    const requestUrl = config?.url ?? 'UNKNOWN';
    const status = error.response?.status;
    const responseUrl = error.response?.config?.url ?? error.request?.responseURL;

    if (isDevelopment) {
      // More concise error logging
      const statusInfo = status ? `${status}` : error.code || 'Network Error';
      console.error(`[API Error] ${method} ${requestUrl} - ${statusInfo}`);
    }

    sendErrorToMonitoring(error, {
      method,
      url: requestUrl,
      status,
      headers: error.response?.headers
        ? Object.fromEntries(Object.entries(error.response.headers))
        : undefined,
    });

    return Promise.reject(error);
  }
);
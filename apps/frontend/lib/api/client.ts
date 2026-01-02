import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Centralized error monitoring hook.
 * Replace with Sentry.captureException or your own sendLog implementation.
 */
function sendErrorToMonitoring(
  error: unknown,
  context: { method?: string; url?: string; status?: number; headers?: Record<string, string> }
): void {
  // Example: Sentry.captureException(error, { extra: context });
  // For now, we just log to console in development
  if (isDevelopment) {
    console.error('[ErrorMonitoring]', { error, context });
  }
  // TODO: Integrate with Sentry or other monitoring service
  // Sentry.captureException(error, { extra: context });
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
      console.error(
        `[Response Error] ${method} ${requestUrl}`,
        status ? `Status: ${status}` : 'No status',
        responseUrl ? `Response URL: ${responseUrl}` : ''
      );
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
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitOptions {
  windowMs?: number;  // Time window in milliseconds
  max?: number;       // Max requests per window
  message?: string;   // Error message
  keyGenerator?: (request: FastifyRequest) => string;
}

const defaultOptions: Required<RateLimitOptions> = {
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // 100 requests per minute
  message: 'Too many requests, please try again later.',
  keyGenerator: (request: FastifyRequest): string => {
    // Use IP address as key (consider X-Forwarded-For in production behind proxy)
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ip || request.ip;
    }
    return request.ip;
  },
};

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based rate limiting
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  const config = { ...defaultOptions, ...options };
  const store: RateLimitStore = {};

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(store)) {
      const entry = store[key];
      if (entry && entry.resetTime < now) {
        delete store[key];
      }
    }
  }, config.windowMs);

  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const key = config.keyGenerator(request);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
    } else {
      store[key].count++;
    }

    const remaining = Math.max(0, config.max - store[key].count);
    const resetTime = Math.ceil((store[key].resetTime - now) / 1000);

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', config.max);
    reply.header('X-RateLimit-Remaining', remaining);
    reply.header('X-RateLimit-Reset', resetTime);

    if (store[key].count > config.max) {
      reply.header('Retry-After', resetTime);
      return reply.status(429).send({
        error: config.message,
        retryAfter: resetTime,
      });
    }
  };
}

/**
 * Register rate limiting plugin for Fastify
 */
export async function rateLimitPlugin(
  fastify: FastifyInstance,
  options: RateLimitOptions = {}
) {
  const rateLimiter = createRateLimiter(options);
  
  // Apply to all routes
  fastify.addHook('preHandler', rateLimiter);
}

// Preset configurations for different endpoints
export const rateLimitPresets = {
  // Strict limit for auth endpoints (prevent brute force)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 attempts
    message: 'Too many login attempts, please try again in 15 minutes.',
  },
  // Standard API limit
  api: {
    windowMs: 60 * 1000,      // 1 minute
    max: 100,                  // 100 requests
    message: 'Too many requests, please slow down.',
  },
  // Relaxed limit for read operations
  read: {
    windowMs: 60 * 1000,      // 1 minute
    max: 200,                  // 200 requests
    message: 'Too many requests, please slow down.',
  },
  // Strict limit for expensive operations (file scanning, hashing)
  expensive: {
    windowMs: 60 * 1000,      // 1 minute
    max: 10,                   // 10 operations
    message: 'Too many expensive operations, please wait.',
  },
};

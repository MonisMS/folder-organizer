import { config } from "dotenv";

config();

// Parse REDIS_URL if provided (e.g., from Upstash)
// Format: rediss://default:password@host:port
function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379'),
    password: parsed.password || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  };
}

const redisUrl = process.env.REDIS_URL;

export const redisConfig = redisUrl 
  ? {
      ...parseRedisUrl(redisUrl),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    }
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    };
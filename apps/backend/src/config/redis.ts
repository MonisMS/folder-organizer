import { config } from "dotenv";

config();

// Parse REDIS_URL if provided (e.g., from Upstash)
// Format: rediss://default:password@host:port
function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  const baseConfig: {
    host: string;
    port: number;
    tls?: object;
    password?: string;
  } = {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379'),
  };
  
  if (parsed.password) {
    baseConfig.password = parsed.password;
  }
  
  if (parsed.protocol === 'rediss:') {
    baseConfig.tls = {};
  }
  
  return baseConfig;
}

const redisUrl = process.env.REDIS_URL;

function buildRedisConfig() {
  if (redisUrl) {
    return {
      ...parseRedisUrl(redisUrl),
      maxRetriesPerRequest: null as null,
      enableReadyCheck: false,
    };
  }
  
  const localConfig: {
    host: string;
    port: number;
    maxRetriesPerRequest: null;
    enableReadyCheck: boolean;
    password?: string;
    tls?: object;
  } = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
  
  if (process.env.REDIS_PASSWORD) {
    localConfig.password = process.env.REDIS_PASSWORD;
  }
  
  if (process.env.REDIS_TLS === 'true') {
    localConfig.tls = {};
  }
  
  return localConfig;
}

export const redisConfig = buildRedisConfig();
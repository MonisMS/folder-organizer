import pino from "pino";

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(isProduction
    ? {
        // Production: JSON format for log aggregation
        formatters: {
          level: (label) => ({ level: label }),
        },
      }
    : {
        // Development: Pretty print
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
});
module.exports = {
  apps: [
    {
      name: 'file-manager-api',
      cwd: './apps/backend',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logging
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policies
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'file-manager-worker',
      cwd: './apps/backend',
      script: 'dist/workers/index.js',
      instances: 1, // Workers handle their own concurrency
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // Logging
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policies
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G', // Workers may need more memory for file hashing
      // Graceful shutdown
      kill_timeout: 30000, // Give workers more time to finish jobs
    },
  ],
};

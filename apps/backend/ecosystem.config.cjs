module.exports = {
  apps: [
    {
      name:          'lagaao-api',
      script:        'dist/app.js',
      instances:     'max',
      exec_mode:     'cluster',
      watch:         false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT:     3000,
      },
      error_file:    'logs/err.log',
      out_file:      'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful shutdown
      kill_timeout:  5000,
      wait_ready:    true,
      listen_timeout: 10000,
    },
  ],
};

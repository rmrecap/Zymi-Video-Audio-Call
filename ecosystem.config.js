module.exports = {
  apps: [
    {
      name: 'zymi-server',
      script: 'index.js',
      cwd: './server',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        CLIENT_ORIGIN: 'http://localhost:5175'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        CLIENT_ORIGIN: 'https://your-domain.com'
      },
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/zymi-server-error.log',
      out_file: 'logs/zymi-server-out.log',
      log_file: 'logs/zymi-server-combined.log',
      merge_logs: true,
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      graceful_shutdown: true,
      source_map_support_override: true,
      exp_backoff_restart_delay: 100,
      tree: false
    }
  ],
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      repo: 'git@github.com:your-org/your-repo.git',
      path: '/var/www/zymi',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
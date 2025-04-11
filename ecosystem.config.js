module.exports = {
  apps : [{
    name: 'solana-mev-api',
    script: '/var/solana_mevbot/dist/api-server.js',
    cwd: '/var/solana_mevbot',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}; 
#!/bin/bash
# 修复Nginx配置的脚本

set -e  # 遇到错误立即停止

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2)

echo "===== 开始修复Nginx配置 ====="

# 创建新的Nginx配置文件
cat > new_nginx_config.conf << 'EOL'
server {
    listen 80;
    server_name sol.deeptv.tv;

    root /home/ubuntu/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/system/memory-stats {
        proxy_pass http://localhost:3100/api/system/memory-stats;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/solana_mevbot_access.log;
    error_log /var/log/nginx/solana_mevbot_error.log;
}
EOL

echo "创建了新的Nginx配置"

# 上传新的Nginx配置
echo "上传新的Nginx配置到服务器..."
scp -i $SSH_KEY_PATH new_nginx_config.conf $SSH_USER@$SSH_HOST:~/

# 在服务器上执行部署
echo "在服务器上应用新的Nginx配置..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST << 'EOF'
  sudo cp ~/new_nginx_config.conf /etc/nginx/sites-available/solana_mevbot.conf
  sudo nginx -t && sudo systemctl restart nginx
  echo "Nginx配置已更新"
EOF

echo "===== Nginx配置修复完成 ====="

# 清理临时文件
rm -f new_nginx_config.conf 
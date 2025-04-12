#!/bin/bash

# 读取SSH连接信息
source .env.deploy

echo "===== 使用完整配置修复Nginx ====="

# 创建一个完整的配置文件
cat > new_nginx.conf << 'EOF'
server {
    listen 80;
    server_name sol.deeptv.tv;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sol.deeptv.tv;

    ssl_certificate /etc/letsencrypt/live/sol.deeptv.tv/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sol.deeptv.tv/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers EECDH+AESGCM:EDH+AESGCM;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 180m;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    
    # 内容安全策略
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self'; frame-src 'none'; object-src 'none';";

    # 根目录配置
    root /home/ubuntu/solana_mev_frontend;
    index index.html;

    # 静态文件缓存设置
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }

    # API代理配置
    location ~ ^/(tokens|system/status|transactions) {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 所有其他请求
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 日志配置
    access_log /var/log/nginx/sol.deeptv.tv-access.log;
    error_log /var/log/nginx/sol.deeptv.tv-error.log;
}
EOF

# 上传完整配置文件
echo "上传完整Nginx配置..."
scp -i $SSH_KEY_PATH new_nginx.conf $SSH_USER@$SSH_HOST:/tmp/new_nginx.conf

# 应用配置
echo "应用新配置..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "
    # 备份当前配置
    sudo cp /etc/nginx/sites-available/sol.deeptv.tv /etc/nginx/sites-available/sol.deeptv.tv.bak.\$(date +%Y%m%d%H%M%S)
    
    # 替换配置
    sudo cp /tmp/new_nginx.conf /etc/nginx/sites-available/sol.deeptv.tv
    
    # 测试配置
    echo '测试Nginx配置...'
    sudo nginx -t
    
    if [ \$? -eq 0 ]; then
        echo '重启Nginx服务...'
        sudo systemctl restart nginx
        echo '✅ Nginx服务已重启'
    else
        echo '❌ Nginx配置测试失败，保留原配置'
        sudo cp /etc/nginx/sites-available/sol.deeptv.tv.bak.\$(ls -t /etc/nginx/sites-available/sol.deeptv.tv.bak.* | head -1 | xargs basename) /etc/nginx/sites-available/sol.deeptv.tv
    fi
"

echo "===== Nginx配置修复完成 =====" 
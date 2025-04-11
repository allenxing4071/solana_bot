#!/bin/bash
# 服务器问题修复脚本

echo "===== 开始服务器问题修复 ====="

# 1. 彻底修复PM2安装问题
echo "正在修复PM2安装问题..."
sudo rm -rf /usr/local/lib/node_modules/pm2
sudo npm cache clean --force
sudo npm install -g pm2@latest --force --no-fund

# 验证PM2安装
if command -v pm2 >/dev/null 2>&1; then
    echo "PM2安装成功，版本: $(pm2 --version)"
else
    echo "PM2安装失败，尝试替代方案..."
    echo "尝试通过NVM安装..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    npm install -g pm2@latest
    
    if command -v pm2 >/dev/null 2>&1; then
        echo "PM2安装成功(替代方案)，版本: $(pm2 --version)"
    else
        echo "错误: PM2安装失败，请手动检查原因"
    fi
fi

# 2. 修复Nginx配置冲突
echo "正在检查Nginx配置..."
NGINX_CONF="/etc/nginx/sites-available/solana_mevbot.conf"

if [ -f "$NGINX_CONF" ]; then
    # 检查并备份现有配置
    echo "备份当前Nginx配置..."
    sudo cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%s)"
    
    # 简单修复方案：完全重新生成配置文件
    echo "重新生成Nginx配置文件..."
    cat > /tmp/new_nginx_config.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name sol.deeptv.tv;

    root /home/ubuntu/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
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
NGINX_EOF

    sudo cp /tmp/new_nginx_config.conf "$NGINX_CONF"
    
    # 测试Nginx配置
    if sudo nginx -t; then
        # 重新加载Nginx配置
        sudo systemctl reload nginx
        echo "Nginx配置已修复并重新加载"
    else
        echo "警告: Nginx配置测试失败，请手动检查"
    fi
else
    echo "警告: Nginx配置文件 $NGINX_CONF 不存在"
fi

# 3. 重启应用程序
echo "正在重启应用程序..."
cd /var/solana_mevbot

# 清理可能存在的旧进程
if command -v pm2 >/dev/null 2>&1; then
    pm2 delete solana-mev-api 2>/dev/null || true
    
    # 启动应用
    NODE_ENV=production pm2 start ecosystem.config.js
    pm2 save
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
    
    # 4. 验证应用是否正常运行
    echo "验证API服务是否响应..."
    sleep 5  # 给应用一些启动时间
    if curl -s http://localhost:3000/api/health | grep -q "status"; then
        echo "API服务健康检查通过"
    else
        echo "警告: API服务健康检查失败，请检查应用日志"
        pm2 logs --lines 20
    fi
else
    echo "无法启动应用程序，因为PM2安装失败"
    # 尝试直接使用node启动
    echo "尝试直接使用Node启动应用..."
    cd /var/solana_mevbot
    NODE_ENV=production node dist/api/server.js &
    echo "应用已启动，进程ID: $!"
fi

echo "===== 服务器问题修复完成 ====="
echo "请在浏览器中访问 http://sol.deeptv.tv 验证应用是否正常运行" 
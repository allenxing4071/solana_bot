#!/bin/bash

# 检查public目录
echo "检查 public 目录..."
ls -la ~/public

# 确认是否有index.html
echo "检查 index.html 文件..."
if [ -f ~/public/index.html ]; then
    echo "index.html 文件存在"
else
    echo "警告: index.html 文件不存在！"
fi

# 安装Nginx
echo "安装 Nginx..."
sudo apt update
sudo apt install -y nginx

# 创建Nginx配置
echo "创建 Nginx 配置..."
sudo bash -c 'cat > /etc/nginx/sites-available/sol.deeptv.tv << EOF
server {
    listen 80;
    server_name sol.deeptv.tv;
    
    root /home/ubuntu/public;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF'

# 创建默认站点配置
echo "创建默认站点配置..."
sudo bash -c 'cat > /etc/nginx/sites-available/default << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /home/ubuntu/public;
    index index.html;
    
    server_name _;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF'

# 启用配置
echo "启用 Nginx 配置..."
sudo ln -sf /etc/nginx/sites-available/sol.deeptv.tv /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# 检查Nginx配置
echo "检查 Nginx 配置..."
sudo nginx -t

# 重启Nginx
echo "重启 Nginx..."
sudo systemctl restart nginx

# 检查Nginx状态
echo "Nginx 状态:"
sudo systemctl status nginx | head -20

echo "配置完成，请访问 http://sol.deeptv.tv 或 http://服务器IP 查看网站" 
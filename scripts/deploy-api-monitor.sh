#!/bin/bash

# 部署API监控页面脚本
# 将API监控页面上传到服务器并配置访问权限

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

# 显示信息
echo -e "${GREEN}开始部署API监控页面...${NC}"

# 读取服务器信息
SSH_HOST=$(grep SSH_HOST .env | cut -d= -f2)
SSH_USER=$(grep SSH_USER .env | cut -d= -f2)
SSH_PORT=$(grep SSH_PORT .env | cut -d= -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d= -f2)

# 检查文件是否存在
if [ ! -f "src/api-monitor.html" ]; then
    echo -e "${RED}错误: API监控页面文件不存在${NC}"
    exit 1
fi

# 检查SSH密钥文件
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${RED}错误: SSH密钥文件不存在: $SSH_KEY_PATH${NC}"
    exit 1
fi

# 确保密钥文件权限正确
chmod 600 "$SSH_KEY_PATH"

# 目标目录
TARGET_DIR="/var/www/html/api-monitor"
API_SERVER_DIR="/var/solana_mevbot"
PUBLIC_DIR="/home/ubuntu/public"

echo -e "${YELLOW}正在连接到服务器 ${SSH_HOST}...${NC}"

# 创建目标目录(如果不存在)
ssh -i "$SSH_KEY_PATH" -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "sudo mkdir -p $TARGET_DIR && sudo chown ${SSH_USER}:${SSH_USER} $TARGET_DIR"

if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 无法创建目标目录${NC}"
    exit 1
fi

# 上传监控页面
echo -e "${YELLOW}正在上传API监控页面...${NC}"
scp -i "$SSH_KEY_PATH" -P "$SSH_PORT" src/api-monitor.html "${SSH_USER}@${SSH_HOST}:$TARGET_DIR/index.html"

if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 无法上传API监控页面${NC}"
    exit 1
fi

# 将页面也复制到公共目录
echo -e "${YELLOW}正在将页面复制到公共目录...${NC}"
ssh -i "$SSH_KEY_PATH" -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "mkdir -p $PUBLIC_DIR && cp $TARGET_DIR/index.html $PUBLIC_DIR/api-monitor.html"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}警告: 无法复制到公共目录，但部署已完成${NC}"
else
    echo -e "${GREEN}页面已复制到公共目录${NC}"
fi

# 设置CORS头（用于允许跨域请求）
echo -e "${YELLOW}正在配置CORS响应头...${NC}"
CORS_CONFIG="
location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
}
"

# 创建一个临时nginx配置文件
echo "$CORS_CONFIG" > /tmp/cors-api.conf

# 上传配置文件
scp -i "$SSH_KEY_PATH" -P "$SSH_PORT" /tmp/cors-api.conf "${SSH_USER}@${SSH_HOST}:/tmp/cors-api.conf"

# 应用配置
ssh -i "$SSH_KEY_PATH" -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "sudo cp /tmp/cors-api.conf /etc/nginx/conf.d/cors-api.conf && sudo nginx -t && sudo systemctl reload nginx || echo 'Nginx配置失败，但页面已部署'"

echo -e "${GREEN}API监控页面部署完成${NC}"
echo -e "${GREEN}可通过以下地址访问:${NC}"
echo -e "${YELLOW}http://${SSH_HOST}/api-monitor/${NC}"
echo -e "${YELLOW}或者:${NC}"
echo -e "${YELLOW}http://${SSH_HOST}:3000/api-monitor.html${NC} (如果直接从API服务器访问)" 
#!/bin/bash

# 部署脚本 - 部署dashboard.html
echo "开始部署dashboard.html文件..."

# 设置服务器信息
SERVER="ubuntu@18.215.154.7"
KEY_FILE="sol-bot-key.pem"
REMOTE_DIR="/home/ubuntu/public"
TEMP_REMOTE_DIR="/home/ubuntu/temp"

# 创建临时目录
TEMP_DIR="deploy_temp"
mkdir -p $TEMP_DIR

# 确保文件在临时目录中
if [ ! -f "$TEMP_DIR/dashboard.html" ]; then
  echo "文件不在临时目录中，正在复制..."
  cp public/dashboard.html $TEMP_DIR/
fi

# 创建远程临时目录
echo "创建远程临时目录..."
ssh -i $KEY_FILE $SERVER "mkdir -p $TEMP_REMOTE_DIR"

# 上传文件到服务器临时目录
echo "上传文件到服务器临时目录..."
scp -i $KEY_FILE $TEMP_DIR/dashboard.html $SERVER:$TEMP_REMOTE_DIR/

# 使用sudo移动文件到目标目录并设置权限
echo "使用sudo移动文件到目标目录并设置权限..."
ssh -i $KEY_FILE $SERVER "sudo cp $TEMP_REMOTE_DIR/dashboard.html $REMOTE_DIR/ && sudo chmod 644 $REMOTE_DIR/dashboard.html"

# 清理临时文件
echo "清理临时文件..."
ssh -i $KEY_FILE $SERVER "rm -f $TEMP_REMOTE_DIR/dashboard.html"

echo "dashboard.html已部署完成！"
echo "请访问 http://sol.deeptv.tv/dashboard.html 查看部署后的页面" 
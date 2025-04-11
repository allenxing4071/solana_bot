#!/bin/bash

# 部署脚本 - 前端布局修改
echo "开始部署布局调整..."

# 设置服务器信息
SERVER="ubuntu@18.215.154.7"
KEY_FILE="sol-bot-key.pem"
REMOTE_DIR="/home/ubuntu/public"
TEMP_REMOTE_DIR="/home/ubuntu/temp"

# 创建临时目录
TEMP_DIR="deploy_temp"
mkdir -p $TEMP_DIR

# 确保文件在临时目录中
if [ ! -f "$TEMP_DIR/index.html" ] || [ ! -f "$TEMP_DIR/custom.css" ]; then
  echo "文件不在临时目录中，正在复制..."
  cp index.html custom.css $TEMP_DIR/
fi

# 创建远程临时目录
echo "创建远程临时目录..."
ssh -i $KEY_FILE $SERVER "mkdir -p $TEMP_REMOTE_DIR"

# 上传文件到服务器临时目录
echo "上传文件到服务器临时目录..."
scp -i $KEY_FILE $TEMP_DIR/index.html $TEMP_DIR/custom.css $SERVER:$TEMP_REMOTE_DIR/

# 使用sudo移动文件到目标目录并设置权限
echo "使用sudo移动文件到目标目录并设置权限..."
ssh -i $KEY_FILE $SERVER "sudo cp $TEMP_REMOTE_DIR/index.html $TEMP_REMOTE_DIR/custom.css $REMOTE_DIR/ && sudo chmod 644 $REMOTE_DIR/index.html $REMOTE_DIR/custom.css"

# 清理临时文件
echo "清理临时文件..."
ssh -i $KEY_FILE $SERVER "rm -f $TEMP_REMOTE_DIR/index.html $TEMP_REMOTE_DIR/custom.css"

echo "布局调整已部署完成！"
echo "请访问 http://sol.deeptv.tv/index.html 查看修改后的布局" 
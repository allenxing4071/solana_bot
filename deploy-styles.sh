#!/bin/bash

# 部署脚本 - 部署样式文件和index.html
echo "开始部署样式文件和index.html..."

# 设置服务器信息
SERVER="ubuntu@18.215.154.7"
KEY_FILE="sol-bot-key.pem"
REMOTE_DIR="/home/ubuntu/public"
REMOTE_CSS_DIR="/home/ubuntu/public/css"
TEMP_REMOTE_DIR="/home/ubuntu/temp"

# 创建临时目录
TEMP_DIR="deploy_temp"
mkdir -p $TEMP_DIR
mkdir -p $TEMP_DIR/css

# 确保文件在临时目录中
echo "复制文件到临时目录..."
cp public/index.html $TEMP_DIR/
cp public/css/style-fix.css $TEMP_DIR/css/

# 创建远程临时目录
echo "创建远程临时目录..."
ssh -i $KEY_FILE $SERVER "mkdir -p $TEMP_REMOTE_DIR/css"

# 上传文件到服务器临时目录
echo "上传文件到服务器临时目录..."
scp -i $KEY_FILE $TEMP_DIR/index.html $SERVER:$TEMP_REMOTE_DIR/
scp -i $KEY_FILE $TEMP_DIR/css/style-fix.css $SERVER:$TEMP_REMOTE_DIR/css/

# 使用sudo移动文件到目标目录并设置权限
echo "使用sudo移动文件到目标目录并设置权限..."
ssh -i $KEY_FILE $SERVER "sudo cp $TEMP_REMOTE_DIR/index.html $REMOTE_DIR/ && \
                          sudo cp $TEMP_REMOTE_DIR/css/style-fix.css $REMOTE_CSS_DIR/ && \
                          sudo chmod 644 $REMOTE_DIR/index.html && \
                          sudo chmod 644 $REMOTE_CSS_DIR/style-fix.css"

# 清理临时文件
echo "清理临时文件..."
ssh -i $KEY_FILE $SERVER "rm -rf $TEMP_REMOTE_DIR"
rm -rf $TEMP_DIR

echo "样式文件和index.html已部署完成！"
echo "请访问 http://sol.deeptv.tv/index.html 查看修复后的页面" 
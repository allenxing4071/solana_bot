#!/bin/bash
# 部署修复版本的脚本和资源

# 设置目标服务器信息
SSH_KEY_PATH="sol-bot-key.pem"
SSH_USER="ubuntu"
SSH_HOST="18.215.154.7"
TARGET_DIR="/home/ubuntu/public"

echo "===== 开始部署修复版本 ====="

# 首先创建临时目录
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_deploy"

# 上传文件到临时目录
echo "上传修复版本的JS文件..."

# 上传JS文件
scp -i $SSH_KEY_PATH public/js/memory.js $SSH_USER@$SSH_HOST:~/temp_deploy/
scp -i $SSH_KEY_PATH public/js/memory-fix.js $SSH_USER@$SSH_HOST:~/temp_deploy/
scp -i $SSH_KEY_PATH public/js/memory-optimize.js $SSH_USER@$SSH_HOST:~/temp_deploy/

# 上传HTML文件
scp -i $SSH_KEY_PATH public/memory.html $SSH_USER@$SSH_HOST:~/temp_deploy/

# 使用sudo将文件移动到目标位置
echo "移动文件到目标目录..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo cp ~/temp_deploy/memory.js $TARGET_DIR/js/ && \
                                         sudo cp ~/temp_deploy/memory-fix.js $TARGET_DIR/js/ && \
                                         sudo cp ~/temp_deploy/memory-optimize.js $TARGET_DIR/js/ && \
                                         sudo cp ~/temp_deploy/memory.html $TARGET_DIR/ && \
                                         rm -rf ~/temp_deploy"

echo "===== 修复版本部署完成 ====="
echo "现在可以访问 http://sol.deeptv.tv/memory.html 查看修复后的页面"

# 部署脚本 - 修复dashboard.js
echo "开始部署修复的dashboard.js文件..."

# 设置服务器信息
SERVER="ubuntu@18.215.154.7"
KEY_FILE="sol-bot-key.pem"
REMOTE_DIR="/home/ubuntu/public/js"
TEMP_REMOTE_DIR="/home/ubuntu/temp"

# 创建临时目录
TEMP_DIR="deploy_temp"
mkdir -p $TEMP_DIR

# 确保文件在临时目录中
if [ ! -f "$TEMP_DIR/dashboard.js" ]; then
  echo "文件不在临时目录中，正在复制..."
  cp public/js/dashboard.js $TEMP_DIR/
fi

# 创建远程临时目录
echo "创建远程临时目录..."
ssh -i $KEY_FILE $SERVER "mkdir -p $TEMP_REMOTE_DIR"

# 上传文件到服务器临时目录
echo "上传文件到服务器临时目录..."
scp -i $KEY_FILE $TEMP_DIR/dashboard.js $SERVER:$TEMP_REMOTE_DIR/

# 使用sudo移动文件到目标目录并设置权限
echo "使用sudo移动文件到目标目录并设置权限..."
ssh -i $KEY_FILE $SERVER "sudo cp $TEMP_REMOTE_DIR/dashboard.js $REMOTE_DIR/ && sudo chmod 644 $REMOTE_DIR/dashboard.js"

# 清理临时文件
echo "清理临时文件..."
ssh -i $KEY_FILE $SERVER "rm -f $TEMP_REMOTE_DIR/dashboard.js"

echo "dashboard.js已修复部署完成！"
echo "请访问 http://sol.deeptv.tv/index.html 查看修复后的页面" 
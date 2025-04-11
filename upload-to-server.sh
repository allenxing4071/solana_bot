#!/bin/bash

# 从.env文件读取SSH连接信息
SSH_HOST=$(grep SSH_HOST .env | cut -d '=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d '=' -f2)
SSH_PORT=$(grep SSH_PORT .env | cut -d '=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d '=' -f2)

# 输出连接信息
echo "准备连接到 $SSH_USER@$SSH_HOST:$SSH_PORT 使用密钥 $SSH_KEY_PATH"

# 检查密钥文件权限并修改（SSH密钥需要600权限）
chmod 600 $SSH_KEY_PATH
echo "已设置密钥文件权限"

# 远程目标路径
REMOTE_PATH="/home/$SSH_USER/solana_MEVbot"

# 使用SSH连接创建目标目录（如果不存在）
echo "创建远程目录（如果不存在）..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "mkdir -p $REMOTE_PATH"

# 使用rsync上传项目文件
echo "开始上传项目文件..."
rsync -avz --progress -e "ssh -i $SSH_KEY_PATH -p $SSH_PORT" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    ./* $SSH_USER@$SSH_HOST:$REMOTE_PATH/

echo "文件上传完成"

# 连接到服务器并设置启动脚本权限
echo "设置启动脚本权限..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "cd $REMOTE_PATH && chmod +x start-app.sh"

echo "上传完成，可以通过以下命令登录服务器并启动应用："
echo "ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST"
echo "cd $REMOTE_PATH && ./start-app.sh" 
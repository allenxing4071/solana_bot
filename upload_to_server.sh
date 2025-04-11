#!/bin/bash

# 上传脚本 - 用于将MEV机器人文件上传到服务器
# 从.env中读取SSH配置

# 读取SSH配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2)
SSH_PORT=$(grep SSH_PORT .env | cut -d'=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2)

# 显示配置
echo "=== 上传配置 ==="
echo "主机: $SSH_HOST"
echo "用户: $SSH_USER"
echo "端口: $SSH_PORT"
echo "密钥: $SSH_KEY_PATH"
echo "=================="

# 服务器上的目标目录
REMOTE_DIR="/var/solana_mevbot"

# 创建远程目录结构
echo "创建远程目录结构..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "mkdir -p $REMOTE_DIR/{src,config,logs,data,scripts,tests,dist}"

# 上传源代码
echo "上传源代码文件..."
scp -i $SSH_KEY_PATH -P $SSH_PORT -r ./src/* $SSH_USER@$SSH_HOST:$REMOTE_DIR/src/

# 上传编译后的文件
echo "上传编译后的文件..."
scp -i $SSH_KEY_PATH -P $SSH_PORT -r ./dist/* $SSH_USER@$SSH_HOST:$REMOTE_DIR/dist/

# 上传配置文件
echo "上传配置文件..."
scp -i $SSH_KEY_PATH -P $SSH_PORT -r ./.env $SSH_USER@$SSH_HOST:$REMOTE_DIR/
scp -i $SSH_KEY_PATH -P $SSH_PORT -r ./config/* $SSH_USER@$SSH_HOST:$REMOTE_DIR/config/

# 上传package.json文件
echo "上传package.json文件..."
scp -i $SSH_KEY_PATH -P $SSH_PORT ./package.json $SSH_USER@$SSH_HOST:$REMOTE_DIR/
scp -i $SSH_KEY_PATH -P $SSH_PORT ./package-lock.json $SSH_USER@$SSH_HOST:$REMOTE_DIR/

# 上传tsconfig.json文件
echo "上传tsconfig.json文件..."
scp -i $SSH_KEY_PATH -P $SSH_PORT ./tsconfig.json $SSH_USER@$SSH_HOST:$REMOTE_DIR/

echo "文件上传完成！"
echo "远程路径: $REMOTE_DIR" 
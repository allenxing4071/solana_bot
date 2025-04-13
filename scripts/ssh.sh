#!/bin/bash

# SSH连接脚本
# 读取.env文件中的SSH配置参数并连接服务器

# 检查node环境
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js环境，请先安装Node.js"
    exit 1
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "警告: 未找到.env文件，将使用默认SSH配置"
fi

# 检查密钥文件
KEY_FILE=$(grep SSH_KEY_PATH .env 2>/dev/null | cut -d= -f2)
if [ -z "$KEY_FILE" ]; then
    KEY_FILE="sol-bot-key.pem"
fi

if [ ! -f "$KEY_FILE" ]; then
    echo "错误: 未找到SSH密钥文件: $KEY_FILE"
    exit 1
fi

# 设置密钥文件权限(SSH要求)
chmod 600 "$KEY_FILE"

# 执行SSH连接脚本
echo "正在连接SSH服务器..."
node scripts/connect_ssh.js

# 检查退出状态
if [ $? -ne 0 ]; then
    echo "SSH连接失败，请检查配置和网络"
    exit 1
fi 
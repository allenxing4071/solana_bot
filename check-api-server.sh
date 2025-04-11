#!/bin/bash
# 检查API服务器状态和配置

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2)

echo "===== 检查API服务器状态 ====="

# 检查后端服务是否运行
echo "检查Node.js进程..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "ps aux | grep node"

# 检查API服务器状态
echo "检查API服务器健康状态..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "curl -s http://localhost:3000/api/health || echo 'API服务未响应'"

# 检查后端目录结构
echo "检查后端目录结构..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "ls -la /var/solana_mevbot/"

# 检查日志文件
echo "检查最近的API日志..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "tail -n 20 /var/solana_mevbot/logs/api_server.log 2>/dev/null || echo '日志文件不存在或无法访问'"

# 检查前端API请求配置
echo "检查前端API配置..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "grep -r '/api/' /home/ubuntu/public/js/ | head -n 10"

echo "===== 检查完成 =====" 
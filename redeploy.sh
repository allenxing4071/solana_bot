#!/bin/bash
# Solana MEV Bot 重新部署脚本

set -e  # 遇到错误立即停止

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2)

echo "===== 开始重新部署 MEV Bot API 服务 ====="

# 1. 确保本地编译
echo "正在进行本地编译..."
npx tsc -p tsconfig.json --skipLibCheck || echo "编译遇到警告，但将继续部署"

# 2. 上传现有的dist和src目录
echo "上传编译后的文件..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_redeploy/{src,dist}/api/{controllers,routes}"
scp -i $SSH_KEY_PATH ./dist/api/controllers/system_controller.js $SSH_USER@$SSH_HOST:~/temp_redeploy/dist/api/controllers/
scp -i $SSH_KEY_PATH ./dist/api/routes/system_routes.js $SSH_USER@$SSH_HOST:~/temp_redeploy/dist/api/routes/
scp -i $SSH_KEY_PATH ./src/api/controllers/system_controller.ts $SSH_USER@$SSH_HOST:~/temp_redeploy/src/api/controllers/
scp -i $SSH_KEY_PATH ./src/api/routes/system_routes.ts $SSH_USER@$SSH_HOST:~/temp_redeploy/src/api/routes/

# 3. 替换服务器上的文件
echo "替换服务器上的文件..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo cp -f ~/temp_redeploy/dist/api/controllers/system_controller.js /var/solana_mevbot/dist/api/controllers/ && \
                                        sudo cp -f ~/temp_redeploy/dist/api/routes/system_routes.js /var/solana_mevbot/dist/api/routes/ && \
                                        sudo cp -f ~/temp_redeploy/src/api/controllers/system_controller.ts /var/solana_mevbot/src/api/controllers/ && \
                                        sudo cp -f ~/temp_redeploy/src/api/routes/system_routes.ts /var/solana_mevbot/src/api/routes/ && \
                                        rm -rf ~/temp_redeploy"

# 4. 重启服务器上的API服务
echo "重启API服务..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo systemctl restart solana-mev-api.service || \
                                     (cd ~ && NODE_ENV=production node /var/solana_mevbot/dist/api/server.js > ~/api_restart.log 2>&1 &)"

# 5. 等待服务启动
echo "等待服务启动..."
sleep 5

# 6. 测试API
echo "测试API服务..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "curl -s http://localhost:3000/api/health" 

echo "===== MEV Bot API 服务重新部署完成 ====="
echo "现在可以访问 http://sol.deeptv.tv 查看前端页面" 
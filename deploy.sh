#!/bin/bash
# 前后端联调一键部署脚本

set -e  # 遇到错误立即停止

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2)

echo "===== 开始前后端联调部署 ====="

# 1. 创建临时目录并上传前端文件
echo "上传前端文件..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_deploy"
scp -i $SSH_KEY_PATH -r ./public/* $SSH_USER@$SSH_HOST:~/temp_deploy/
# 使用sudo移动文件到目标目录
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo rm -rf /home/ubuntu/public/*"
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo cp -r ~/temp_deploy/* /home/ubuntu/public/"
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo chown -R www-data:www-data /home/ubuntu/public/"
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "rm -rf ~/temp_deploy"

# 2. 上传后端文件
echo "上传后端文件..."
# 确保目标目录存在且有权限
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo mkdir -p /var/solana_mevbot/{src,dist,logs,config} && sudo chown -R $SSH_USER:$SSH_USER /var/solana_mevbot"
scp -i $SSH_KEY_PATH -r ./dist/* $SSH_USER@$SSH_HOST:/var/solana_mevbot/dist/
scp -i $SSH_KEY_PATH -r ./src/* $SSH_USER@$SSH_HOST:/var/solana_mevbot/src/
scp -i $SSH_KEY_PATH ./.env $SSH_USER@$SSH_HOST:/var/solana_mevbot/
scp -i $SSH_KEY_PATH ./package.json $SSH_USER@$SSH_HOST:/var/solana_mevbot/
scp -i $SSH_KEY_PATH ./ecosystem.config.js $SSH_USER@$SSH_HOST:/var/solana_mevbot/

# 3. 上传系统路由文件（使用真实数据）
echo "替换系统路由为真实数据版本..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p /var/solana_mevbot/src/api/routes/ /var/solana_mevbot/dist/api/routes/"
scp -i $SSH_KEY_PATH ./src/api/routes/system_routes_real.ts $SSH_USER@$SSH_HOST:/var/solana_mevbot/src/api/routes/system_routes.ts
scp -i $SSH_KEY_PATH ./src/api/routes/system_routes_real.ts $SSH_USER@$SSH_HOST:/var/solana_mevbot/dist/api/routes/system_routes.js

# 4. 上传Nginx配置
echo "上传并应用Nginx配置..."
scp -i $SSH_KEY_PATH ./nginx-config.conf $SSH_USER@$SSH_HOST:/tmp/solana_mevbot.conf
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo mv /tmp/solana_mevbot.conf /etc/nginx/sites-available/solana_mevbot.conf && \
                                         sudo ln -sf /etc/nginx/sites-available/solana_mevbot.conf /etc/nginx/sites-enabled/ && \
                                         sudo nginx -t && \
                                         sudo systemctl reload nginx"

# 5. 安装和配置PM2
echo "配置PM2进程管理..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "cd /var/solana_mevbot && \
                                         sudo npm install -g pm2 && \
                                         pm2 delete solana-mev-api 2>/dev/null || true && \
                                         pm2 start ecosystem.config.js && \
                                         pm2 save && \
                                         sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $SSH_USER --hp /home/$SSH_USER"

# 6. 验证部署
echo "验证部署..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "curl -s http://localhost:3000/api/health || echo 'API服务未响应'"
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "curl -s http://localhost:3000/api/system/status || echo 'API状态接口未响应'"

echo "===== 前后端联调部署完成 ====="
echo "现在可以访问 http://sol.deeptv.tv 查看前端页面"
echo "确保前端能够正确通过API获取后端数据" 
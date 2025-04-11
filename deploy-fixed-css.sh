#!/bin/bash
# 部署修复版本的CSS文件

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")

echo "===== 开始部署修复版本的CSS文件 ====="

# 1. 创建临时目录并上传修复后的文件
echo "上传修复版本的CSS文件..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_deploy_fixed_css"

# 上传修复后的CSS文件
scp -i $SSH_KEY_PATH public/css/fix.css $SSH_USER@$SSH_HOST:~/temp_deploy_fixed_css/fix.css

# 2. 使用sudo移动文件到目标目录
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo cp ~/temp_deploy_fixed_css/fix.css /home/ubuntu/public/css/fix.css && \
                                          sudo chown www-data:www-data /home/ubuntu/public/css/fix.css && \
                                          rm -rf ~/temp_deploy_fixed_css"

echo "===== CSS文件修复版本部署完成 ====="
echo "现在可以访问 http://sol.deeptv.tv/memory.html 查看修复后的样式" 
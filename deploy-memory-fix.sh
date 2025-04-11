#!/bin/bash
# 部署内存页面修复脚本

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")

echo "===== 开始修复内存监控页面 ====="

# 1. 修复memory.js文件
echo "修复memory.js文件..."
cat public/js/memory.js public/js/memory-fix.js > public/js/memory-complete.js

# 2. 创建临时目录并上传修复后的文件
echo "上传修复后的文件..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_deploy_fix"
scp -i $SSH_KEY_PATH -r public/js/memory-complete.js $SSH_USER@$SSH_HOST:~/temp_deploy_fix/memory.js

# 3. 使用sudo移动文件到目标目录
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo cp ~/temp_deploy_fix/memory.js /home/ubuntu/public/js/memory.js && \
                                         sudo chown www-data:www-data /home/ubuntu/public/js/memory.js && \
                                         rm -rf ~/temp_deploy_fix"

echo "===== 内存监控页面修复完成 ====="
echo "现在可以访问 http://sol.deeptv.tv/memory.html 查看修复后的页面" 
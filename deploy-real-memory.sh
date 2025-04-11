#!/bin/bash
# 部署真实API版本的内存监控页面

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")

echo "===== 开始部署真实API版本的内存监控页面 ====="

# 1. 合并原始memory.js和真实API函数
echo "创建真实API版本的memory.js文件..."
# 先保留原始文件的开头部分（初始化、变量、事件监听等）
grep -B1000 "async function fetchMemoryData" public/js/memory.js > public/js/memory-combined.js
# 再从memory-fix.js添加checkMemoryLeaks函数
grep -A1000 "function checkMemoryLeaks" public/js/memory-fix.js >> public/js/memory-combined.js
# 最后添加真实API函数
cat public/js/memory-real.js >> public/js/memory-combined.js

# 2. 创建临时目录并上传修复后的文件
echo "上传真实API版本的文件..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_deploy_real"
scp -i $SSH_KEY_PATH -r public/js/memory-combined.js $SSH_USER@$SSH_HOST:~/temp_deploy_real/memory.js

# 3. 使用sudo移动文件到目标目录
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo cp ~/temp_deploy_real/memory.js /home/ubuntu/public/js/memory.js && \
                                         sudo chown www-data:www-data /home/ubuntu/public/js/memory.js && \
                                         rm -rf ~/temp_deploy_real"

echo "===== 内存监控页面部署完成 ====="
echo "现在可以访问 http://sol.deeptv.tv/memory.html 查看使用真实API的内存监控页面" 
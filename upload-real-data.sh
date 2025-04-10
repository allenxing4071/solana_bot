#!/bin/bash
# 上传切换到真实数据的文件到服务器

# 显示上传信息
echo "正在上传配置文件到服务器..."

# 上传主配置文件
echo "上传 config.js..."
scp -i sol-bot-key.pem public/config.js ubuntu@18.215.154.7:/home/ubuntu/public/

# 上传所有修改后的HTML文件
echo "上传 HTML文件..."
scp -i sol-bot-key.pem public/index.html ubuntu@18.215.154.7:/home/ubuntu/public/
scp -i sol-bot-key.pem public/settings.html ubuntu@18.215.154.7:/home/ubuntu/public/
scp -i sol-bot-key.pem public/tokens.html ubuntu@18.215.154.7:/home/ubuntu/public/
scp -i sol-bot-key.pem public/pools.html ubuntu@18.215.154.7:/home/ubuntu/public/
scp -i sol-bot-key.pem public/trades.html ubuntu@18.215.154.7:/home/ubuntu/public/
scp -i sol-bot-key.pem public/memory.html ubuntu@18.215.154.7:/home/ubuntu/public/

echo "文件上传完成！系统已切换到真实数据模式。" 
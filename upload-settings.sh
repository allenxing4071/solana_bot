#!/bin/bash
# 上传设置页面相关文件到服务器

# 显示上传信息
echo "正在上传设置页面文件到服务器..."

# 上传settings.html
echo "上传 settings.html..."
scp -i sol-bot-key.pem public/settings.html ubuntu@18.215.154.7:/home/ubuntu/public/

# 上传settings.css
echo "上传 settings.css..."
scp -i sol-bot-key.pem public/css/settings.css ubuntu@18.215.154.7:/home/ubuntu/public/css/

echo "文件上传完成！" 
#!/bin/bash
# 部署修改后的文件到服务器

# 从.env文件读取SSH连接信息
if [ -f .env ]; then
  SSH_HOST=$(grep SSH_HOST .env | cut -d '=' -f2)
  SSH_USER=$(grep SSH_USER .env | cut -d '=' -f2)
  SSH_PORT=$(grep SSH_PORT .env | cut -d '=' -f2)
  SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d '=' -f2)
else
  # 使用默认值
  SSH_HOST="18.215.154.7"
  SSH_USER="ubuntu"
  SSH_PORT="22"
  SSH_KEY_PATH="sol-bot-key.pem"
fi

# 设置远程目标路径
REMOTE_PUBLIC_PATH="/home/ubuntu/public"
REMOTE_JS_PATH="/home/ubuntu/public/js"
TEMP_PATH="/home/ubuntu/temp_deploy"

echo "===== 开始部署修改后的文件到 sol.deeptv.tv ====="
echo "准备连接到 $SSH_USER@$SSH_HOST:$SSH_PORT 使用密钥 $SSH_KEY_PATH"

# 检查密钥文件权限并修改
chmod 600 $SSH_KEY_PATH
echo "已设置密钥文件权限"

# 创建临时目录
echo "创建临时上传目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "mkdir -p $TEMP_PATH"

# 上传dashboard.js到临时目录
echo "上传dashboard.js到临时目录..."
scp -i $SSH_KEY_PATH -P $SSH_PORT public/js/dashboard.js $SSH_USER@$SSH_HOST:$TEMP_PATH/

# 使用sudo移动文件到目标目录
echo "移动文件到Web目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo cp $TEMP_PATH/dashboard.js $REMOTE_JS_PATH/ && sudo chown www-data:www-data $REMOTE_JS_PATH/dashboard.js"

# 上传index.html到临时目录
echo "上传index.html到临时目录..."
scp -i $SSH_KEY_PATH -P $SSH_PORT public/index.html $SSH_USER@$SSH_HOST:$TEMP_PATH/

# 使用sudo移动文件到目标目录
echo "移动文件到Web根目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo cp $TEMP_PATH/index.html $REMOTE_PUBLIC_PATH/ && sudo chown www-data:www-data $REMOTE_PUBLIC_PATH/index.html"

# 清理临时目录
echo "清理临时目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "rm -rf $TEMP_PATH"

echo "验证文件上传..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "ls -la $REMOTE_JS_PATH/dashboard.js $REMOTE_PUBLIC_PATH/index.html"

# 确保Web服务器重新加载
echo "重新加载Nginx..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo systemctl reload nginx"

echo "===== 部署完成 ====="
echo "现在可以访问 http://sol.deeptv.tv/index.html 查看更新后的页面" 
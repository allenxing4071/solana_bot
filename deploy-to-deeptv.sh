#!/bin/bash
# 部署到sol.deeptv.tv的脚本

# 从.env文件读取SSH连接信息
SSH_HOST=$(grep SSH_HOST .env | cut -d '=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d '=' -f2)
SSH_PORT=$(grep SSH_PORT .env | cut -d '=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d '=' -f2)

# 设置远程目标路径
REMOTE_PUBLIC_PATH="/home/ubuntu/public"
TEMP_PATH="/home/ubuntu/temp_deploy"

echo "===== 开始部署到 sol.deeptv.tv ====="
echo "准备连接到 $SSH_USER@$SSH_HOST:$SSH_PORT 使用密钥 $SSH_KEY_PATH"

# 检查密钥文件权限并修改
chmod 600 $SSH_KEY_PATH
echo "已设置密钥文件权限"

# 将dashboard.html复制并重命名为index.html
echo "准备文件..."
cp public/dashboard.html public/index.html
echo "已将dashboard.html复制为index.html"

# 创建临时目录
echo "创建临时上传目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "mkdir -p $TEMP_PATH"

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
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "ls -la $REMOTE_PUBLIC_PATH/index.html"

# 清理服务器上不需要的文件
echo "清理服务器上不需要的文件..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo rm -f $REMOTE_PUBLIC_PATH/css/card-fix.css $REMOTE_PUBLIC_PATH/dashboard-new.html"

# 确保Web服务器重新加载
echo "重新加载Nginx..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo systemctl reload nginx"

echo "===== 部署完成 ====="
echo "现在可以访问 http://sol.deeptv.tv/index.html 查看更新后的页面" 
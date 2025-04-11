#!/bin/bash
# 恢复原始页面脚本

# 从.env文件读取SSH连接信息
SSH_HOST=$(grep SSH_HOST .env | cut -d '=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d '=' -f2)
SSH_PORT=$(grep SSH_PORT .env | cut -d '=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d '=' -f2)

# 设置远程目标路径
REMOTE_PUBLIC_PATH="/home/ubuntu/public"
TEMP_PATH="/home/ubuntu/temp_restore"

echo "===== 开始恢复原始页面 ====="
echo "准备连接到 $SSH_USER@$SSH_HOST:$SSH_PORT 使用密钥 $SSH_KEY_PATH"

# 检查密钥文件权限并修改
chmod 600 $SSH_KEY_PATH
echo "已设置密钥文件权限"

# 从备份文件恢复
echo "从备份文件恢复..."
cp public/dashboard.html.bak public/dashboard.html
cp public/dashboard.html.bak public/index.html
echo "已将备份文件恢复"

# 创建临时目录
echo "创建临时上传目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "mkdir -p $TEMP_PATH"

# 上传文件到临时目录
echo "上传恢复的文件到临时目录..."
scp -i $SSH_KEY_PATH -P $SSH_PORT public/index.html $SSH_USER@$SSH_HOST:$TEMP_PATH/
scp -i $SSH_KEY_PATH -P $SSH_PORT public/dashboard.html $SSH_USER@$SSH_HOST:$TEMP_PATH/

# 使用sudo移动文件到目标目录
echo "移动文件到Web根目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo cp $TEMP_PATH/index.html $REMOTE_PUBLIC_PATH/ && sudo chown www-data:www-data $REMOTE_PUBLIC_PATH/index.html"
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo cp $TEMP_PATH/dashboard.html $REMOTE_PUBLIC_PATH/ && sudo chown www-data:www-data $REMOTE_PUBLIC_PATH/dashboard.html"

# 清理临时目录
echo "清理临时目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "rm -rf $TEMP_PATH"

echo "验证文件上传..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "ls -la $REMOTE_PUBLIC_PATH/index.html $REMOTE_PUBLIC_PATH/dashboard.html"

# 确保Web服务器重新加载
echo "重新加载Nginx..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo systemctl reload nginx"

echo "===== 恢复完成 ====="
echo "页面已恢复到原始状态，请访问 http://sol.deeptv.tv/index.html 查看" 
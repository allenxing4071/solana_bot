#!/bin/bash

# 从.env文件读取SSH连接信息
SSH_HOST=$(grep SSH_HOST .env | cut -d '=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d '=' -f2)
SSH_PORT=$(grep SSH_PORT .env | cut -d '=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d '=' -f2)

# 输出连接信息
echo "准备连接到 $SSH_USER@$SSH_HOST:$SSH_PORT 使用密钥 $SSH_KEY_PATH"

# 检查密钥文件权限并修改（SSH密钥需要600权限）
chmod 600 $SSH_KEY_PATH
echo "已设置密钥文件权限"

# 远程目标路径
REMOTE_PATH="/home/$SSH_USER/solana_MEVbot"

# 只上传修改的CSS文件
echo "上传修改后的CSS文件..."

# 上传修改后的CSS文件
rsync -avz --progress -e "ssh -i $SSH_KEY_PATH -p $SSH_PORT" \
    public/css/card-fix.css \
    $SSH_USER@$SSH_HOST:$REMOTE_PATH/public/css/

echo "CSS文件上传完成"

# 提示刷新浏览器
echo "修复文件已上传。请刷新浏览器查看效果。"
echo "如果需要，请在服务器上重启应用："
echo "ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST"
echo "cd $REMOTE_PATH && ./start-app.sh" 
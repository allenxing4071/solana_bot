#!/bin/bash
# 创建UI所需的图标

set -e  # 遇到错误立即停止

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2)

echo "===== 开始创建UI所需的图标 ====="

# 创建临时目录
echo "创建临时目录..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_icons/img"

# 创建必要的SVG图标
echo "创建图标文件..."

# CPU图标
cat > cpu.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4DB6FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
  <rect x="9" y="9" width="6" height="6"></rect>
  <line x1="9" y1="1" x2="9" y2="4"></line>
  <line x1="15" y1="1" x2="15" y2="4"></line>
  <line x1="9" y1="20" x2="9" y2="23"></line>
  <line x1="15" y1="20" x2="15" y2="23"></line>
  <line x1="20" y1="9" x2="23" y2="9"></line>
  <line x1="20" y1="14" x2="23" y2="14"></line>
  <line x1="1" y1="9" x2="4" y2="9"></line>
  <line x1="1" y1="14" x2="4" y2="14"></line>
</svg>
EOL

# 内存图标
cat > memory.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4DFFBD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
  <line x1="6" y1="6" x2="6" y2="18"></line>
  <line x1="10" y1="6" x2="10" y2="18"></line>
  <line x1="14" y1="6" x2="14" y2="18"></line>
  <line x1="18" y1="6" x2="18" y2="18"></line>
</svg>
EOL

# 时钟图标
cat > clock.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#BD4DFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <polyline points="12 6 12 12 16 14"></polyline>
</svg>
EOL

# 钱包图标
cat > wallet.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFBF4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"></path>
  <path d="M16 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
  <path d="M21 8H16.5v8H21V8z"></path>
</svg>
EOL

# 仪表盘图标
cat > dashboard.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4DB6FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="7" height="9"></rect>
  <rect x="14" y="3" width="7" height="5"></rect>
  <rect x="14" y="12" width="7" height="9"></rect>
  <rect x="3" y="16" width="7" height="5"></rect>
</svg>
EOL

# 流动性池图标
cat > pools.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4DFFBD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 20V10"></path>
  <path d="M12 20V4"></path>
  <path d="M6 20v-6"></path>
</svg>
EOL

# 代币图标
cat > tokens.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#BD4DFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="8"></circle>
  <line x1="16.2" y1="7.8" x2="7.8" y2="16.2"></line>
  <line x1="7.8" y1="7.8" x2="16.2" y2="16.2"></line>
</svg>
EOL

# 交易图标
cat > trades.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFBF4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="2" x2="12" y2="22"></line>
  <path d="M17 5l-5-3-5 3"></path>
  <path d="M17 19l-5 3-5-3"></path>
</svg>
EOL

# 系统图标
cat > system.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF6E4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z"></path>
  <line x1="16" y1="8" x2="2" y2="22"></line>
  <line x1="17.5" y1="15" x2="9" y2="15"></line>
</svg>
EOL

# 设置图标
cat > settings.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4DB6FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
</svg>
EOL

# 播放图标
cat > play.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="5 3 19 12 5 21 5 3"></polygon>
</svg>
EOL

# 停止图标
cat > stop.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="6" y="6" width="12" height="12" rx="1"></rect>
</svg>
EOL

# 上传图标
echo "上传图标..."
scp -i $SSH_KEY_PATH *.svg $SSH_USER@$SSH_HOST:~/temp_icons/img/

# 移动图标到Web根目录
echo "移动图标到Web根目录..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo cp -r ~/temp_icons/img/* /home/ubuntu/public/img/ && sudo chown www-data:www-data /home/ubuntu/public/img/*"

# 清理临时文件
echo "清理临时文件..."
rm -f *.svg
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "rm -rf ~/temp_icons"

echo "===== 图标创建完成 ====="
echo "所有必要的图标已上传，请刷新页面查看效果" 
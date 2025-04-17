#!/bin/bash

# 通过Cursor企业会员访问Claude的代理服务器启动脚本

# 设置工作目录
cd "$(dirname "$0")"

# 检查.env文件并设置USE_CURSOR_FOR_CLAUDE=true
if [ -f .env ]; then
  # 检查是否已经有USE_CURSOR_FOR_CLAUDE配置
  if grep -q "USE_CURSOR_FOR_CLAUDE" .env; then
    # 更新现有设置为true
    sed -i.bak 's/USE_CURSOR_FOR_CLAUDE=.*/USE_CURSOR_FOR_CLAUDE=true/' .env
  else
    # 添加新设置
    echo "USE_CURSOR_FOR_CLAUDE=true" >> .env
  fi
else
  # 创建新的.env文件
  echo "USE_CURSOR_FOR_CLAUDE=true" > .env
  echo "已创建.env文件"
fi

# 检查CURSOR_API_KEY是否已设置
if ! grep -q "CURSOR_API_KEY=.*[a-zA-Z0-9]" .env; then
  echo "警告: CURSOR_API_KEY未设置或为空。请在.env文件中添加您的Cursor企业版API密钥。"
  echo "格式: CURSOR_API_KEY=your_cursor_enterprise_key_here"
fi

# 启动Node服务器
echo "正在启动Cursor-Claude代理服务器..."
node claude_proxy_intelligent_routing.js

# 捕获CTRL+C并优雅关闭
trap "echo '正在关闭服务器...'; exit 0" INT TERM

# 输出帮助信息
echo "服务器已启动。使用CTRL+C停止服务器。"

# 等待进程结束
wait 
#!/bin/bash

# 模型代理系统停止脚本
# 停止代理服务器和管理界面

echo "正在停止模型代理系统..."

# 如果存在PID文件，使用文件中的PID停止进程
if [ -f logs/proxy_server.pid ]; then
  PROXY_PID=$(cat logs/proxy_server.pid)
  echo "正在停止代理服务器 (PID: $PROXY_PID)..."
  kill $PROXY_PID 2>/dev/null || true
  rm logs/proxy_server.pid
fi

if [ -f logs/admin_dashboard.pid ]; then
  ADMIN_PID=$(cat logs/admin_dashboard.pid)
  echo "正在停止管理界面 (PID: $ADMIN_PID)..."
  kill $ADMIN_PID 2>/dev/null || true
  rm logs/admin_dashboard.pid
fi

# 使用pkill作为备份方法，确保所有进程都被终止
echo "确保所有相关进程已终止..."
pkill -f "node claude_proxy.js" || true
pkill -f "node admin_dashboard.js" || true

echo "模型代理系统已停止" 
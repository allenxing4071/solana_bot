#!/bin/bash

# 启动API服务（后端）- 在8080端口
echo "启动API服务 - 端口8080..."
cd "$(dirname "$0")"
npm run api:dev &
API_PID=$!

# 等待3秒，确保API服务已启动
echo "等待API服务启动..."
sleep 3

# 启动前端UI服务 - 在8082端口
echo "启动前端UI服务 - 端口8082..."
cd solana_webbot
http-server -p 8082 &
UI_PID=$!

echo "所有服务已启动"
echo "API服务 PID: $API_PID"
echo "UI服务 PID: $UI_PID"
echo "访问地址: http://localhost:8082"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait 
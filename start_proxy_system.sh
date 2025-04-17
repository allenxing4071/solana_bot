#!/bin/bash

# 模型代理系统启动脚本
# 同时启动代理服务器和管理界面

# 终止可能已运行的实例
echo "正在终止已运行的实例..."
pkill -f "node claude_proxy.js" || true
pkill -f "node admin_dashboard.js" || true

# 确保安装了必要的依赖
echo "检查并安装必要的依赖..."
npm install express axios dotenv ejs

# 确保logs目录存在
mkdir -p logs

# 启动代理服务器
echo "启动模型代理服务器..."
node claude_proxy.js > logs/proxy_server.log 2>&1 &
PROXY_PID=$!
echo "代理服务器已启动，PID: $PROXY_PID"

# 等待代理服务器启动完成
echo "等待代理服务器初始化..."
sleep 3

# 启动管理界面
echo "启动管理界面..."
node admin_dashboard.js > logs/admin_dashboard.log 2>&1 &
ADMIN_PID=$!
echo "管理界面已启动，PID: $ADMIN_PID"

# 保存进程ID，以便后续可以停止服务
echo "$PROXY_PID" > logs/proxy_server.pid
echo "$ADMIN_PID" > logs/admin_dashboard.pid

# 显示访问信息
# 从.env文件中提取端口信息，避免直接source
PROXY_PORT=$(grep -E "^CLAUDE_PROXY_PORT=" .env | cut -d'=' -f2 || echo "3100")
ADMIN_PORT=$(grep -E "^ADMIN_DASHBOARD_PORT=" .env | cut -d'=' -f2 || echo "3200")

echo ""
echo "==================== 系统已启动 ===================="
echo "模型代理服务器: http://localhost:$PROXY_PORT/health"
echo "管理界面: http://localhost:$ADMIN_PORT"
echo "日志文件位置: ./logs/"
echo "要停止服务，请运行: ./stop_proxy_system.sh"
echo "===================================================" 
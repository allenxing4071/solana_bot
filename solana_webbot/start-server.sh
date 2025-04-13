#!/bin/bash

# 启动API服务器脚本
# 此脚本用于在solana_webbot目录中启动API服务器

# 确保脚本在solana_webbot目录下执行
cd "$(dirname "$0")"

echo "启动Solana MEV机器人API服务器..."
echo "当前目录: $(pwd)"

# 检查node是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查必要的文件是否存在
if [ ! -f "simple-api-server.js" ]; then
    echo "错误: 未找到simple-api-server.js文件"
    exit 1
fi

# 检查是否已经有服务器运行
if pgrep -f "node simple-api-server.js" > /dev/null; then
    echo "警告: API服务器似乎已经在运行中"
    echo "如果想重启服务器，请先运行 ./stop-server.sh"
    exit 0
fi

# 检查package.json是否存在，如果存在则安装依赖
if [ -f "package.json" ]; then
    echo "发现package.json，安装依赖..."
    npm install
fi

# 检查必要的依赖是否已安装
if [ ! -d "node_modules/express" ] || [ ! -d "node_modules/cors" ]; then
    echo "警告: 可能缺少必要的依赖，尝试安装..."
    npm install express cors
fi

# 创建日志目录
mkdir -p logs

# 启动服务器（后台运行，并将输出重定向到日志文件）
echo "正在启动API服务器，端口: 8080..."
NODE_OPTIONS="--max-old-space-size=512" nohup node simple-api-server.js > logs/api-server.log 2>&1 &

# 保存PID到文件中
echo $! > .api-server.pid

# 等待5秒，检查服务器是否成功启动
echo "等待服务器启动..."
sleep 5

if pgrep -f "node simple-api-server.js" > /dev/null; then
    echo "✅ API服务器已成功启动并在后台运行"
    echo "您可以通过以下地址访问:"
    echo "- 接口监控: http://localhost:8080/api-monitor.html"
    echo "- 接口列表: http://localhost:8080/api/list"
    echo "- 仪表盘: http://localhost:8080/index.html"
    echo ""
    echo "查看日志: tail -f logs/api-server.log"
    echo "停止服务: ./stop-server.sh"
    
    # 检查日志中是否有"服务器已停止"信息
    if grep -q "服务器已停止" logs/api-server.log; then
        echo "❌ 警告: 服务器可能已经停止，请检查日志文件"
        cat logs/api-server.log
    fi
else
    echo "❌ 服务器启动失败，请检查日志文件 logs/api-server.log"
    cat logs/api-server.log
fi
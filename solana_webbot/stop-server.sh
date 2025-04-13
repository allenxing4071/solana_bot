#!/bin/bash

# 停止API服务器脚本

echo "正在停止Solana MEV机器人API服务器..."

# 检查是否有PID文件
if [ -f ".api-server.pid" ]; then
    PID=$(cat .api-server.pid)
    if ps -p $PID > /dev/null; then
        echo "找到运行中的API服务器进程(PID: $PID)，正在停止..."
        kill $PID
        sleep 1
        
        # 再次检查进程是否已终止
        if ps -p $PID > /dev/null; then
            echo "进程未响应，尝试强制终止..."
            kill -9 $PID
            sleep 1
        fi
        
        # 最后检查
        if ! ps -p $PID > /dev/null; then
            echo "✅ API服务器已成功停止"
            rm .api-server.pid
        else
            echo "❌ 无法停止服务器进程，请手动终止 PID: $PID"
        fi
    else
        echo "PID文件中的进程($PID)已不存在，可能已经停止"
        rm .api-server.pid
    fi
else
    # 尝试通过进程名查找
    PID=$(pgrep -f "node simple-api-server.js")
    if [ -n "$PID" ]; then
        echo "找到运行中的API服务器进程(PID: $PID)，正在停止..."
        kill $PID
        sleep 1
        
        # 再次检查进程是否已终止
        if pgrep -f "node simple-api-server.js" > /dev/null; then
            echo "进程未响应，尝试强制终止..."
            pkill -9 -f "node simple-api-server.js"
            sleep 1
        fi
        
        if ! pgrep -f "node simple-api-server.js" > /dev/null; then
            echo "✅ API服务器已成功停止"
        else
            echo "❌ 无法停止服务器进程，请手动终止"
        fi
    else
        echo "未找到运行中的API服务器进程"
    fi
fi 
#!/bin/bash

# SOL MEV机器人启动脚本
# 用于启动API服务器和前端

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}开始启动SOL MEV机器人...${NC}"

# 检查是否已安装Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到Node.js，请先安装Node.js${NC}"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}正在安装依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}依赖安装失败${NC}"
        exit 1
    fi
fi

# 编译TypeScript（如果需要）
echo -e "${YELLOW}正在编译TypeScript...${NC}"
npm run build || npx tsc
if [ $? -ne 0 ]; then
    echo -e "${RED}TypeScript编译失败${NC}"
    exit 1
fi

# 启动后端API服务器
echo -e "${YELLOW}正在启动API服务器...${NC}"
node dist/api-server.js &
API_PID=$!

# 等待API服务器启动
echo -e "${YELLOW}等待API服务器启动...${NC}"
sleep 3

# 检查API服务器是否成功启动
if ! kill -0 $API_PID &> /dev/null; then
    echo -e "${RED}API服务器启动失败${NC}"
    exit 1
fi

echo -e "${GREEN}API服务器已成功启动，PID: $API_PID${NC}"

# 提供访问提示
echo -e "\n${GREEN}=== SOL MEV机器人已启动 ===${NC}"
echo -e "前端地址: ${GREEN}http://localhost:3000${NC}"
echo -e "API地址: ${GREEN}http://localhost:3000/api${NC}"
echo -e "\n使用 ${YELLOW}Ctrl+C${NC} 停止服务"

# 捕获中断信号，优雅关闭
trap 'echo -e "\n${YELLOW}正在关闭服务...${NC}"; kill $API_PID; echo -e "${GREEN}服务已关闭${NC}"; exit 0' INT

# 保持脚本运行
while true; do
    sleep 1
done 
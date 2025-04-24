FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 构建TypeScript
RUN npm run build

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["node", "dist/api-server.js"] 
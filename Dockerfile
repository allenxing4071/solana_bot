FROM node:20

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm install telegraf@4.12.2

# 复制源代码
COPY mini_telegram_test.cjs ./

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "mini_telegram_test.cjs"] 
/**
 * 简单的静态文件服务器
 */
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080; // 前端服务器端口
const API_PORT = 3000; // API服务器端口

// 启用请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API代理中间件配置
const apiProxy = createProxyMiddleware({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' }, // 不改变路径
  logLevel: 'debug'
});

// 应用API代理，所有/api路径的请求都会被转发
app.use('/api', apiProxy);

// 静态文件服务，提供public目录下的文件
app.use(express.static(path.join(__dirname, 'public')));

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 确保HTML文件能被正确访问
app.get('*.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path));
});

// 未找到路由的处理
app.use((req, res) => {
  console.log(`[404] 未找到: ${req.url}`);
  res.status(404).send('页面未找到');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`前端服务器已启动在 http://localhost:${PORT}`);
  console.log(`API请求将被代理到 http://localhost:${API_PORT}`);
  console.log(`请访问 http://localhost:${PORT}/pools.html 查看流动性池页面`);
}); 
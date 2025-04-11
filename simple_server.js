/**
 * 简单的静态文件服务器
 */
const express = require('express');
const path = require('node:path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080; // 使用不同的端口
const API_PORT = 3000; // API服务器端口

// 启用详细日志
app.use((req, res, next) => {
  console.log(`请求: ${req.method} ${req.url}`);
  next();
});

// 配置API代理 - 必须在其他路由之前配置
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true,
  logLevel: 'debug'
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 所有HTML页面路由 - 使用通配符处理所有HTML请求
app.get('*.html', (req, res) => {
  const pageName = req.path;
  console.log(`请求页面: ${pageName}`);
  res.sendFile(path.join(__dirname, 'public', pageName));
});

// 主页路由
app.get('/', (req, res) => {
  console.log('请求主页');
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 404处理
app.use((req, res) => {
  console.log(`未找到: ${req.url}`);
  res.status(404).send('页面未找到');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动在 http://localhost:${PORT}`);
  console.log(`API代理已配置，转发到 http://localhost:${API_PORT}`);
  console.log(`请使用浏览器访问 http://localhost:${PORT}/pools.html 测试`);
}); 
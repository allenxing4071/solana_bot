// 模型代理服务器管理界面
// 提供可视化运维和监控功能
const express = require('express');
const axios = require('axios');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.ADMIN_DASHBOARD_PORT || 3200;
const PROXY_SERVER_URL = `http://localhost:${process.env.CLAUDE_PROXY_PORT || 3100}`;

// 日志目录
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 配置Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// 创建必要的目录
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
  fs.mkdirSync(viewsDir, { recursive: true });
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const cssDir = path.join(publicDir, 'css');
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
}

const jsDir = path.join(publicDir, 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

// 创建视图文件
const dashboardView = path.join(viewsDir, 'dashboard.ejs');
fs.writeFileSync(dashboardView, `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>模型代理管理界面</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>模型代理服务器管理界面</h1>
            <div class="status-badge <%= serverStatus.status === 'ok' ? 'online' : 'offline' %>">
                <%= serverStatus.status === 'ok' ? '在线' : '离线' %>
            </div>
        </header>

        <section class="server-info card">
            <h2>服务器状态</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">状态</span>
                    <span class="value"><%= serverStatus.status === 'ok' ? '正常运行' : '异常' %></span>
                </div>
                <div class="info-item">
                    <span class="label">负载均衡</span>
                    <span class="value"><%= serverStatus.load_balancing === 'enabled' ? '已启用' : '已禁用' %></span>
                </div>
                <div class="info-item">
                    <span class="label">Fallback 机制</span>
                    <span class="value"><%= serverStatus.fallback === 'enabled' ? '已启用' : '已禁用' %></span>
                </div>
                <div class="info-item">
                    <span class="label">语义路由</span>
                    <span class="value"><%= serverStatus.semantic_routing === 'enabled' ? '已启用' : '已禁用' %></span>
                </div>
            </div>
        </section>

        <section class="models card">
            <h2>可用模型</h2>
            <div class="model-list">
                <% if (models.length === 0) { %>
                    <div class="empty-state">暂无可用模型</div>
                <% } else { %>
                    <table>
                        <thead>
                            <tr>
                                <th>模型名称</th>
                                <th>提供商</th>
                                <th>当前权重</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <% models.forEach(model => { %>
                                <tr>
                                    <td><%= model.name %></td>
                                    <td><%= model.provider %></td>
                                    <td>
                                        <input type="number" min="0" max="100" value="<%= model.weight %>" 
                                               class="weight-input" data-model="<%= model.name %>">
                                    </td>
                                    <td>
                                        <button class="test-btn" data-model="<%= model.name %>">测试</button>
                                    </td>
                                </tr>
                            <% }); %>
                        </tbody>
                    </table>
                    <div class="controls">
                        <button id="save-weights" class="primary-btn">保存权重设置</button>
                    </div>
                <% } %>
            </div>
        </section>

        <section class="test-model card">
            <h2>模型测试</h2>
            <div class="test-form">
                <div class="form-row">
                    <label for="test-model">选择模型：</label>
                    <select id="test-model">
                        <option value="">自动选择 (语义路由)</option>
                        <% models.forEach(model => { %>
                            <option value="<%= model.name %>"><%= model.name %></option>
                        <% }); %>
                    </select>
                </div>
                <div class="form-row">
                    <label for="test-message">测试消息：</label>
                    <textarea id="test-message" rows="3" placeholder="输入测试消息..."></textarea>
                </div>
                <div class="form-row controls">
                    <button id="send-test" class="primary-btn">发送测试</button>
                </div>
            </div>
            <div class="test-result">
                <h3>测试结果</h3>
                <div class="result-container">
                    <div class="result-meta">
                        <div class="meta-item">
                            <span class="label">使用模型：</span>
                            <span id="result-model" class="value">-</span>
                        </div>
                        <div class="meta-item">
                            <span class="label">响应时间：</span>
                            <span id="result-time" class="value">-</span>
                        </div>
                    </div>
                    <div class="result-content">
                        <pre id="result-text">在这里输入测试消息并点击"发送测试"按钮来查看结果...</pre>
                    </div>
                </div>
            </div>
        </section>

        <section class="logs card">
            <h2>系统日志</h2>
            <div class="log-controls">
                <button id="refresh-logs" class="secondary-btn">刷新日志</button>
                <button id="clear-logs" class="secondary-btn danger">清除日志</button>
            </div>
            <div class="log-container">
                <pre id="log-content"><%= logs %></pre>
            </div>
        </section>
    </div>

    <script src="/js/dashboard.js"></script>
</body>
</html>`);

// 创建CSS文件
const cssFile = path.join(cssDir, 'style.css');
fs.writeFileSync(cssFile, `/* 全局样式 */
:root {
    --primary-color: #4a6cf7;
    --success-color: #10b981;
    --danger-color: #ef4444;
    --warning-color: #f59e0b;
    --text-color: #374151;
    --light-text: #6b7280;
    --border-color: #e5e7eb;
    --bg-color: #f9fafb;
    --card-bg: #ffffff;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    line-height: 1.5;
    color: var(--text-color);
    background-color: var(--bg-color);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

/* 头部样式 */
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

header h1 {
    font-size: 1.8rem;
    font-weight: 600;
}

.status-badge {
    padding: 0.4rem 0.8rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
}

.status-badge.online {
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
}

.status-badge.offline {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--danger-color);
}

/* 卡片样式 */
.card {
    background-color: var(--card-bg);
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.card h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-color);
}

/* 信息网格 */
.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.info-item {
    display: flex;
    flex-direction: column;
}

.label {
    font-size: 0.875rem;
    color: var(--light-text);
    margin-bottom: 0.25rem;
}

.value {
    font-weight: 500;
}

/* 表格样式 */
table {
    width: 100%;
    border-collapse: collapse;
}

table th,
table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

table th {
    font-weight: 500;
    color: var(--light-text);
}

/* 输入框样式 */
input, select, textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.1);
}

.weight-input {
    width: 70px;
}

/* 按钮样式 */
button {
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
}

.primary-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
}

.primary-btn:hover {
    background-color: #3b5cf6;
}

.secondary-btn {
    background-color: white;
    color: var(--text-color);
    border: 1px solid var(--border-color);
}

.secondary-btn:hover {
    background-color: var(--bg-color);
}

.danger {
    color: var(--danger-color);
}

.danger:hover {
    background-color: rgba(239, 68, 68, 0.1);
}

.test-btn {
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    color: var(--text-color);
}

.test-btn:hover {
    background-color: #f3f4f6;
}

.controls {
    margin-top: 1rem;
    display: flex;
    justify-content: flex-end;
}

/* 表单样式 */
.form-row {
    margin-bottom: 1rem;
}

.form-row label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

/* 结果容器 */
.result-container {
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    overflow: hidden;
}

.result-meta {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    background-color: var(--bg-color);
    border-bottom: 1px solid var(--border-color);
}

.result-content {
    padding: 1rem;
    max-height: 300px;
    overflow-y: auto;
}

.result-content pre {
    white-space: pre-wrap;
    word-break: break-word;
}

/* 日志样式 */
.log-controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.log-container {
    background-color: #1e293b;
    color: #e2e8f0;
    border-radius: 0.375rem;
    padding: 1rem;
    font-family: monospace;
    height: 300px;
    overflow-y: auto;
}

.log-container pre {
    white-space: pre-wrap;
    word-break: break-word;
}

/* 空状态 */
.empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--light-text);
}`);

// 创建JavaScript文件
const jsFile = path.join(jsDir, 'dashboard.js');
fs.writeFileSync(jsFile, `// 模型代理管理界面脚本
document.addEventListener('DOMContentLoaded', function() {
    // 保存权重设置
    document.getElementById('save-weights').addEventListener('click', function() {
        const weightInputs = document.querySelectorAll('.weight-input');
        const weights = {};
        
        weightInputs.forEach(input => {
            const modelName = input.dataset.model;
            const weight = parseInt(input.value);
            weights[modelName] = weight;
        });
        
        // 发送到API
        fetch('/api/weights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(weights)
        })
        .then(response => response.json())
        .then(data => {
            alert('权重设置已保存！');
            console.log('设置保存成功:', data);
        })
        .catch(error => {
            alert('保存失败: ' + error.message);
            console.error('保存失败:', error);
        });
    });
    
    // 测试模型
    document.getElementById('send-test').addEventListener('click', function() {
        const modelSelect = document.getElementById('test-model');
        const messageInput = document.getElementById('test-message');
        
        const model = modelSelect.value;
        const message = messageInput.value.trim();
        
        if (!message) {
            alert('请输入测试消息！');
            return;
        }
        
        // 显示加载状态
        document.getElementById('result-model').textContent = '加载中...';
        document.getElementById('result-time').textContent = '计算中...';
        document.getElementById('result-text').textContent = '正在等待响应...';
        
        const startTime = new Date();
        
        // 发送到API
        fetch('/api/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                message: message
            })
        })
        .then(response => response.json())
        .then(data => {
            const endTime = new Date();
            const timeElapsed = (endTime - startTime) / 1000;
            
            document.getElementById('result-model').textContent = data.model_used;
            document.getElementById('result-time').textContent = \`\${timeElapsed.toFixed(2)}秒\`;
            document.getElementById('result-text').textContent = data.content;
        })
        .catch(error => {
            document.getElementById('result-model').textContent = '错误';
            document.getElementById('result-time').textContent = '-';
            document.getElementById('result-text').textContent = \`发生错误: \${error.message}\`;
        });
    });
    
    // 刷新日志
    document.getElementById('refresh-logs').addEventListener('click', function() {
        fetch('/api/logs')
        .then(response => response.text())
        .then(data => {
            document.getElementById('log-content').textContent = data;
        })
        .catch(error => {
            console.error('获取日志失败:', error);
        });
    });
    
    // 清除日志
    document.getElementById('clear-logs').addEventListener('click', function() {
        if (confirm('确定要清除日志吗？')) {
            fetch('/api/logs/clear', {
                method: 'POST'
            })
            .then(() => {
                document.getElementById('log-content').textContent = '日志已清除';
            })
            .catch(error => {
                console.error('清除日志失败:', error);
            });
        }
    });
    
    // 模型测试按钮
    document.querySelectorAll('.test-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modelName = this.dataset.model;
            document.getElementById('test-model').value = modelName;
            document.getElementById('test-message').value = \`你好，请简单介绍一下你自己，你是什么模型？\`;
            // 滚动到测试区域
            document.querySelector('.test-model').scrollIntoView({ behavior: 'smooth' });
        });
    });
});`);

// 路由
// 首页 - 显示管理界面
app.get('/', async (req, res) => {
  try {
    // 获取服务器状态
    const statusResponse = await axios.get(`${PROXY_SERVER_URL}/health`);
    const serverStatus = statusResponse.data;
    
    // 获取可用模型
    const modelsResponse = await axios.get(`${PROXY_SERVER_URL}/models`);
    const models = modelsResponse.data.models || [];
    
    // 读取日志文件
    let logs = '';
    const logFilePath = path.join(logDir, 'model_proxy.log');
    
    if (fs.existsSync(logFilePath)) {
      // 读取最后100行日志
      const fileContent = fs.readFileSync(logFilePath, 'utf-8');
      const lines = fileContent.split('\n');
      logs = lines.slice(-100).join('\n');
    }
    
    res.render('dashboard', { 
      serverStatus,
      models,
      logs
    });
  } catch (error) {
    console.error('获取数据失败:', error.message);
    
    // 如果无法连接到代理服务器，显示离线状态
    res.render('dashboard', { 
      serverStatus: { status: 'error', message: '无法连接到模型代理服务器' },
      models: [],
      logs: `错误: 无法连接到模型代理服务器 (${error.message})`
    });
  }
});

// API: 保存权重设置
app.post('/api/weights', async (req, res) => {
  try {
    const weights = req.body;
    const response = await axios.post(`${PROXY_SERVER_URL}/api/config/weights`, weights);
    res.json(response.data);
  } catch (error) {
    console.error('保存权重失败:', error.message);
    res.status(500).json({ error: `保存权重失败: ${error.message}` });
  }
});

// API: 测试模型
app.post('/api/test', async (req, res) => {
  try {
    const { model, message } = req.body;
    
    // 构建请求体
    const requestBody = {
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    };
    
    // 如果指定了模型，添加到请求
    if (model) {
      requestBody.model = model;
    }
    
    // 发送到代理服务器
    const response = await axios.post(`${PROXY_SERVER_URL}/api/chat`, requestBody);
    
    // 解析响应
    let content = '';
    if (response.data?.content) {
      // 处理不同格式的content返回
      if (Array.isArray(response.data.content)) {
        // Claude格式
        content = response.data.content.map(item => item.text).join('\n');
      } else {
        // 其他格式
        content = response.data.content;
      }
    } else if (response.data?.choices?.[0]) {
      // OpenAI格式
      content = response.data.choices[0].message.content;
    }
    
    res.json({
      model_used: response.data._actual_model_used || model || '自动选择',
      content: content
    });
  } catch (error) {
    console.error('测试模型失败:', error.message);
    res.status(500).json({ 
      error: `测试模型失败: ${error.message}`,
      model_used: '错误',
      content: `发生错误: ${error.message}`
    });
  }
});

// API: 获取日志
app.get('/api/logs', (req, res) => {
  try {
    const logFilePath = path.join(logDir, 'model_proxy.log');
    
    if (fs.existsSync(logFilePath)) {
      // 读取最后200行日志
      const fileContent = fs.readFileSync(logFilePath, 'utf-8');
      const lines = fileContent.split('\n');
      const logs = lines.slice(-200).join('\n');
      res.send(logs);
    } else {
      res.send('日志文件不存在');
    }
  } catch (error) {
    console.error('获取日志失败:', error.message);
    res.status(500).send(`获取日志失败: ${error.message}`);
  }
});

// API: 清除日志
app.post('/api/logs/clear', (req, res) => {
  try {
    const logFilePath = path.join(logDir, 'model_proxy.log');
    
    if (fs.existsSync(logFilePath)) {
      const timestamp = new Date().toISOString();
      fs.writeFileSync(logFilePath, '日志已清除 - ' + timestamp + '\n');
      res.send({ success: true });
    } else {
      res.send({ success: false, message: '日志文件不存在' });
    }
  } catch (error) {
    console.error('清除日志失败:', error.message);
    res.status(500).json({ success: false, error: '清除日志失败: ' + error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`管理界面已启动，访问地址: http://localhost:${PORT}`);
}); 
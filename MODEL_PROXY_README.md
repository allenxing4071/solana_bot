# 高级模型代理系统

一个强大的多模型代理服务器，支持负载均衡、故障转移和语义路由，兼容本地部署模型、云API和Cursor。

## 功能特点

✅ **多模型调用**：同时支持Claude、OpenAI、Cursor等云服务和Ollama等本地模型
✅ **智能语义路由**：自动根据请求内容选择最合适的模型
✅ **负载均衡**：根据配置的权重分配请求到不同模型
✅ **Fallback机制**：当首选模型不可用时自动切换到备用模型
✅ **Cursor集成**：无缝对接Cursor，优化代码相关问题处理
✅ **可视化管理界面**：提供友好的Web界面进行监控和配置
✅ **完整的日志系统**：详细记录所有操作，方便故障排查

## 系统要求

- Node.js 14+
- npm 或 yarn
- 可选：本地部署的Ollama服务

## 安装步骤

1. 安装依赖：

```bash
npm install express axios dotenv ejs
```

2. 配置环境变量：

编辑`.env`文件，设置以下配置项：
- `CLAUDE_API_KEY`：Claude API密钥
- `OPENAI_API_KEY`：OpenAI API密钥（可选）
- `CURSOR_API_KEY`：Cursor API密钥（可选）
- `CLAUDE_PROXY_PORT`：代理服务器端口（默认3100）
- `ADMIN_DASHBOARD_PORT`：管理界面端口（默认3200）

## 启动和停止

### 启动服务

使用启动脚本一键启动整个系统：

```bash
./start_proxy_system.sh
```

或者分别启动各组件：

```bash
# 启动代理服务器
node claude_proxy.js

# 启动管理界面
node admin_dashboard.js
```

### 停止服务

使用停止脚本关闭所有服务：

```bash
./stop_proxy_system.sh
```

## 接口说明

### 代理服务器接口

- **健康检查**: `GET /health`
- **获取模型列表**: `GET /models`
- **统一聊天接口**: `POST /api/chat`
- **Claude兼容接口**: `POST /api/claude`
- **更新模型权重**: `POST /api/config/weights`

### 统一聊天接口示例

```javascript
// 发送请求到统一接口
const response = await fetch('http://localhost:3100/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-3-opus', // 可选，不指定则由系统自动选择
    messages: [
      {
        role: 'user',
        content: '你好，请简单介绍一下自己'
      }
    ],
    max_tokens: 500,
    temperature: 0.7,
    // 可选：自定义路由规则
    routing_rules: [
      {
        pattern: '代码',
        model: 'cursor'
      }
    ]
  })
});

const result = await response.json();
console.log('使用模型:', result._actual_model_used);
console.log('回复内容:', result.content);
```

## 管理界面

访问管理界面：`http://localhost:3200`

管理界面提供以下功能：
- 查看服务器状态和可用模型
- 调整模型权重设置
- 测试不同模型的响应
- 查看和管理系统日志

## 自定义和扩展

### 添加新模型

修改`claude_proxy.js`文件中的`MODELS`对象，添加新模型配置：

```javascript
'your-model-name': {
  provider: 'your-provider',
  endpoint: 'https://api.your-provider.com/endpoint',
  headers: (apiKey) => ({
    'Authorization': `Bearer ${apiKey}`,
    // 其他必要的头信息
  }),
  formatRequest: (params) => ({
    // 转换为该模型API需要的请求格式
  }),
  parseResponse: (response) => ({
    // 解析响应为统一格式
  })
}
```

### 自定义语义路由

修改`routeBySemantics`函数，根据你的需求调整路由逻辑：

```javascript
if (content.includes('你的关键词')) {
  return '最合适的模型名称';
}
```

## 故障排查

1. **服务无法启动**：
   - 检查端口是否被占用
   - 确认环境变量是否正确配置
   - 查看日志文件获取详细错误信息

2. **API调用失败**：
   - 确认API密钥正确且未过期
   - 检查网络连接
   - 查看日志了解详细错误原因

3. **管理界面无法访问**：
   - 确认admin_dashboard.js正在运行
   - 检查ADMIN_DASHBOARD_PORT设置
   - 查看admin_dashboard.log日志文件

## 开发计划

- [ ] 添加更多模型支持
- [ ] 实现流式响应功能
- [ ] 增强管理界面功能
- [ ] 添加用户认证和访问控制
- [ ] 优化请求缓存机制 
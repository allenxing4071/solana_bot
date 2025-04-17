# 多模型代理服务器

这是一个高级的多模型代理服务器，支持多种大型语言模型的集成调用，具有负载均衡、故障转移和智能路由功能。该系统可无缝集成Llama3智能路由系统，提供基于学习的动态模型选择能力。

## 主要特性

- **多模型支持**：集成Claude、GPT、DeepSeek等多种大模型
- **负载均衡**：根据权重自动分配请求到不同模型
- **故障转移**：当首选模型不可用时自动切换到备用模型
- **语义路由**：基于规则的静态语义路由功能
- **智能路由**：集成基于Llama3的自学习路由系统
- **管理面板**：实时监控模型状态和请求统计
- **易于扩展**：简单的模型配置系统，方便添加新模型

## 模型支持

当前支持的模型包括：

- **Claude系列**：Claude-3-Opus、Claude-3-Sonnet、Claude-3-Haiku、Claude-3.7-Sonnet等
- **OpenAI系列**：GPT-4o等
- **DeepSeek系列**：DeepSeek-V3.1、DeepSeek-R1等
- **本地部署模型**：通过Ollama接口支持本地部署模型

## 文件结构

```
intelligent_routing/proxy/
├── claude_proxy.js         # 主代理服务器
├── admin_dashboard.js      # 管理仪表盘服务器
├── start_proxy_system.sh   # 启动脚本
├── stop_proxy_system.sh    # 停止脚本
├── .env                    # 环境变量配置
├── config/                 # 配置文件目录
│   ├── settings.json       # 一般设置
│   ├── default.json        # 默认配置
│   ├── production.json     # 生产环境配置
│   ├── whitelist.json      # IP白名单
│   ├── blacklist.json      # IP黑名单
│   └── tokens.json         # API令牌
├── views/                  # 视图模板
│   └── dashboard.ejs       # 仪表盘页面模板
└── public/                 # 静态资源
    ├── api-monitor.html    # API监控页面
    ├── css/                # 样式文件
    └── js/                 # 脚本文件
```

## 安装与配置

1. 确保已安装Node.js 14+
2. 配置环境变量（`.env`文件）：
   - 设置各模型的API密钥
   - 配置代理服务器端口
   - 设置管理面板凭据

## 启动与停止

启动代理系统：
```bash
./start_proxy_system.sh
```

停止代理系统：
```bash
./stop_proxy_system.sh
```

## 与智能路由系统集成

代理系统可以与Llama3智能路由系统集成，提供基于学习的模型选择：

1. 在`claude_proxy.js`中导入智能路由集成模块：
```javascript
const { integrateIntelligentRouting } = require('../api/integration');
```

2. 初始化智能路由系统：
```javascript
const { intelligentRoute, updateRouteResult, shutdown } = integrateIntelligentRouting(
  app,
  MODELS,
  MODEL_STATUS,
  MODEL_WEIGHTS,
  routeBySemantics
);
```

3. 使用智能路由替代原有路由：
```javascript
const selectedModel = await intelligentRoute(messages);
```

详细集成方法请参考`../examples/integrate_with_proxy.js`。

## API接口

### 聊天接口
```
POST /api/chat
```

请求体：
```json
{
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "model": "claude-3-opus",  // 可选，不指定时使用路由
  "max_tokens": 1000,
  "temperature": 0.7
}
```

### 健康检查
```
GET /health
```

### 模型列表
```
GET /models
```

## 管理面板

访问管理面板：
```
http://localhost:3200/dashboard
```

管理面板功能：
- 查看模型状态和可用性
- 监控请求量和错误率
- 调整模型权重
- 查看系统日志

## 授权

本项目仅供参考和学习使用，请遵守相关API提供商的使用条款和限制。 
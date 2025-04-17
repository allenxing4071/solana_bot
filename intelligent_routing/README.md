# 基于Llama3的智能路由系统

这是一个基于Llama3的自学习智能语义路由系统，能够根据用户查询的特征智能选择最合适的大模型进行处理。该系统通过本地部署的Llama3模型进行路由决策，并根据历史数据和用户反馈不断优化路由策略。

## 系统组成

系统由两个主要部分组成：

1. **智能路由系统**：基于Llama3的自学习路由引擎，负责智能选择最合适的模型
2. **多模型代理服务器**：支持多种大模型的调用服务，具有负载均衡和故障转移功能

## 特点

- **低延迟决策**：基于本地部署的Llama3模型，提供快速的路由决策
- **自动特征提取**：分析查询的语言、领域和复杂度
- **学习与优化**：记录路由决策和结果，根据用户反馈优化决策
- **数据驱动**：基于历史性能统计，为不同任务选择最合适的模型
- **完整API**：提供路由分析、反馈收集和性能统计接口
- **易于集成**：可以轻松集成到现有的代理系统中
- **多模型支持**：支持Claude、GPT、DeepSeek等多种大模型
- **负载均衡**：根据权重自动分配请求到不同模型
- **故障转移**：当首选模型不可用时自动切换到备用模型

## 系统要求

- Node.js 14+
- Ollama (用于本地部署Llama3模型)
- SQLite3
- 各大模型的API密钥（可选配置）

## 项目结构

```
intelligent_routing/
├── api/                   # API集成模块
│   └── integration.js     # 与现有代理系统的集成接口
├── cli.js                 # 命令行测试工具
├── db/                    # 数据库模块
│   └── database.js        # 查询和路由决策数据的存储与分析
├── engine/                # 路由引擎
│   └── llama3_router.js   # 基于Llama3模型的路由决策实现
├── examples/              # 集成示例
│   └── integrate_with_proxy.js  # 与Claude代理集成示例
├── frontend/              # 前端界面(如果有)
├── index.js               # 主模块，智能路由系统入口
├── package.json           # 项目依赖配置
├── proxy/                 # 多模型代理系统
│   ├── claude_proxy.js    # 主代理服务器
│   ├── admin_dashboard.js # 管理仪表盘服务器
│   ├── start_proxy_system.sh # 启动脚本
│   ├── stop_proxy_system.sh  # 停止脚本
│   ├── config/            # 配置文件目录
│   ├── views/             # 视图模板
│   ├── public/            # 静态资源
│   └── README.md          # 代理系统说明文档
├── README.md              # 项目说明文档
├── scripts/               # 脚本工具
│   ├── init_db.js         # 数据库初始化脚本
│   └── install.sh         # 安装脚本
└── utils/                 # 工具模块
    ├── feature_extractor.js  # 查询特征提取器
    ├── logger.js          # 日志工具
    └── proxy_client.js    # 代理客户端工具
```

## 核心模块说明

- **engine/llama3_router.js**: 智能路由核心引擎，负责调用Llama3模型进行决策
- **utils/feature_extractor.js**: 分析用户查询的语言、领域和复杂度
- **db/database.js**: 管理路由决策数据和模型性能统计
- **api/integration.js**: 提供与现有系统集成的接口
- **index.js**: 系统主模块，协调各组件工作
- **cli.js**: 命令行测试工具，可用于测试和演示
- **proxy/claude_proxy.js**: 多模型代理服务器，支持多种大模型调用

## 安装步骤

### 1. 智能路由系统安装

```bash
cd intelligent_routing
npm install
```

安装Ollama和下载Llama3模型:

```bash
# MacOS/Linux
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3
```

初始化数据库:

```bash
npm run init-db
```

### 2. 多模型代理系统配置

配置环境变量（`.env`文件）:
- 设置各模型的API密钥
- 配置代理服务器端口
- 设置管理面板凭据

## 使用方法

### 1. 运行代理系统

```bash
cd intelligent_routing/proxy
./start_proxy_system.sh
```

### 2. 测试智能路由

使用命令行测试工具:

```bash
cd intelligent_routing
npm start
```

### 3. 管理面板访问

```
http://localhost:3200/dashboard
```

## 集成到现有系统

要将智能路由系统集成到现有的代理系统中，可以使用`api/integration.js`模块:

```javascript
const { integrateIntelligentRouting } = require('./intelligent_routing/api/integration');

// 集成到Express应用
const { intelligentRoute, updateRouteResult, shutdown } = integrateIntelligentRouting(
  app,            // Express应用实例
  MODELS,         // 模型配置
  MODEL_STATUS,   // 模型状态
  MODEL_WEIGHTS,  // 模型权重
  existingRouteFunction // 现有的路由函数
);

// 使用智能路由函数替代现有的路由函数
async function routeMessages(messages) {
  return await intelligentRoute(messages);
}
```

## API接口

### 智能路由API

- `POST /api/routing/analyze`: 分析查询并返回路由决策
- `POST /api/routing/feedback`: 提交用户对路由决策的反馈
- `GET /api/routing/stats`: 获取模型性能统计数据

### 多模型代理API

- `POST /api/chat`: 发送聊天请求 
- `GET /health`: 健康检查
- `GET /models`: 获取可用模型列表

## 路由决策原理

该系统使用以下步骤进行路由决策:

1. **特征提取**: 分析查询的语言、领域和复杂度
2. **模型匹配**: 将查询特征与各模型的历史性能数据匹配
3. **Llama3决策**: 使用Llama3模型进行最终路由决策
4. **反馈学习**: 记录用户反馈，不断优化模型选择

## 数据结构

系统维护以下核心数据:

- **查询记录**: 存储用户查询和提取的特征
- **路由决策**: 记录选择的模型、决策原因和结果
- **用户反馈**: 收集用户对路由决策的评分和评论
- **模型性能**: 跟踪各模型在不同领域和语言的表现

## 自定义和扩展

可以通过以下方式自定义系统:

- 修改`utils/feature_extractor.js`中的特征提取逻辑
- 调整`engine/llama3_router.js`中的提示模板
- 在`scripts/init_db.js`中添加或修改初始模型性能数据
- 在`proxy/claude_proxy.js`中添加新的模型支持

## 许可证

MIT 
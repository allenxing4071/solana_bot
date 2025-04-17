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

# 多模型代理智能路由系统实施方案

## 1. 项目概述

基于Llama3的自学习智能语义路由系统，作为现有多模型代理的增强功能，实现根据用户习惯和各大模型能力特点动态分配请求。系统将从静态规则路由转变为自适应学习型路由，不断优化模型选择决策，提高用户体验和资源利用效率。

## 2. 背景与目标

### 2.1 现状分析
- 当前系统使用预定义规则进行语义路由，缺乏学习能力
- 多模型支持良好，但模型选择依赖静态权重和规则
- 用户习惯和偏好未被有效记录和利用
- 各模型专长领域未被智能化识别和应用

### 2.2 核心目标
- 开发基于Llama3的本地智能路由系统，实现低延迟路由决策
- 建立数据收集和分析机制，持续学习各模型专长
- 根据历史数据和用户反馈调整路由策略，提高首次成功率
- 降低路由决策延迟，减少资源消耗

## 3. 技术选型

### 3.1 路由决策引擎
- **主要模型**：Llama3-8B (通过Ollama本地部署)
  - 响应速度优势：预期3-5秒，远低于现有云API
  - 无API调用费用：降低运营成本
  - 已有Ollama集成：利用现有`llama3`模型配置

### 3.2 数据存储
- **主要数据库**：SQLite（轻量级，适合嵌入式应用）
- **备选方案**：MongoDB（如需更复杂的查询和扩展性）

### 3.3 API接口
- 基于Express的REST API，扩展现有API接口
- 向前兼容当前的路由机制，平滑过渡

## 4. 系统架构

### 4.1 核心组件
1. **特征提取器**：分析用户查询的语言、主题、复杂度等
2. **路由决策引擎**：基于Llama3的本地推理系统
3. **数据收集层**：记录查询、路由决策和模型性能
4. **学习优化器**：定期分析数据并优化路由策略
5. **反馈系统**：收集用户对响应的评价

### 4.2 数据流程图
```
用户查询 → 特征提取 → Llama3路由决策 → 模型调用 → 响应
   ↑                      ↓                  ↓
   └── 学习优化器 ← 数据收集层 ← 性能记录 ← 用户反馈
```

### 4.3 组件交互
- **智能路由模块**与现有`routeBySemantics`函数集成
- **数据收集模块**记录每次路由决策和性能数据
- **用户反馈接口**通过API和UI收集反馈
- **学习优化器**定期更新Llama3的提示模板

## 5. 功能需求

### 5.1 路由分析与决策
- 基于Llama3的快速路由分析（目标<3秒）
- 多维度特征提取（语言、主题、复杂度、长度等）
- 模型专长匹配算法，准确分配请求
- 置信度评估，低置信度时回退到规则路由

### 5.2 数据收集与学习
- 查询特征存储和分类
- 模型性能数据收集（响应时间、成功率、用户反馈）
- 模型专长画像构建与更新
- 用户偏好学习与记忆

### 5.3 反馈与优化
- 简单的用户反馈界面（1-5星评分）
- 反馈数据分析和路由调整
- 模型性能报告生成
- 提示模板自动优化

### 5.4 管理与监控
- 路由决策可视化面板
- 模型性能和专长报告
- 手动调整参数的界面
- 系统学习进度指标

## 6. 技术实现细节

### 6.1 Llama3路由引擎实现
```javascript
// llama3_router.js
const llama3Router = {
  // 初始化路由引擎
  async initialize() {
    // 检查Ollama是否可用
    try {
      const response = await axios.get('http://localhost:11434/api/version');
      logger.log('Ollama已连接，版本:', response.data.version);
      // 确保llama3模型已下载
      await this.ensureModelAvailable();
      return true;
    } catch (error) {
      logger.error('Ollama连接失败，路由引擎将使用备用方案:', error.message);
      return false;
    }
  },

  // 确保模型可用
  async ensureModelAvailable() {
    try {
      await axios.post('http://localhost:11434/api/pull', {
        name: 'llama3',
        stream: false
      });
      logger.log('Llama3模型准备就绪');
    } catch (error) {
      logger.error('Llama3模型下载失败:', error.message);
      throw error;
    }
  },

  // 路由决策
  async routeQuery(query, availableModels, modelStats) {
    const routingPrompt = this.buildRoutingPrompt(query, availableModels, modelStats);
    
    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'llama3',
        prompt: routingPrompt,
        stream: false
      });
      
      return this.parseRoutingDecision(response.data.response);
    } catch (error) {
      logger.error('Llama3路由决策失败:', error.message);
      // 回退到规则路由
      return null;
    }
  },

  // 构建路由提示
  buildRoutingPrompt(query, availableModels, modelStats) {
    return `系统: 你是一个智能路由系统。根据查询特点选择最合适的AI模型。
    
查询: "${query}"

可用模型及其专长:
${availableModels.map(m => `- ${m.name}: ${m.description}, 成功率: ${modelStats[m.name]?.successRate || 'N/A'}%, 平均响应时间: ${modelStats[m.name]?.averageResponseTime || 'N/A'}ms`).join('\n')}

分析查询的语言、主题、复杂度，然后选择最合适的模型。
输出格式: {"selectedModel": "模型名称", "confidence": 0-100, "reasoning": "选择理由"}

你的分析和选择:`;
  },

  // 解析路由决策
  parseRoutingDecision(responseText) {
    try {
      // 尝试提取JSON
      const jsonMatch = responseText.match(/\{.*"selectedModel".*\}/s);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        return {
          model: decision.selectedModel,
          confidence: decision.confidence,
          reasoning: decision.reasoning
        };
      }
      
      // 如果没有找到JSON，尝试提取模型名称
      const modelMatch = responseText.match(/selectedModel['"]*:[\s]*['"]*([a-zA-Z0-9\-\.]+)['"]/);
      if (modelMatch && modelMatch[1]) {
        return {
          model: modelMatch[1],
          confidence: 50, // 默认中等置信度
          reasoning: "通过文本提取获得模型名称"
        };
      }
      
      // 无法解析
      logger.error('无法从Llama3响应中解析出路由决策');
      return null;
    } catch (error) {
      logger.error('解析路由决策时出错:', error.message);
      return null;
    }
  }
};
```

### 6.2 数据库模式设计
```javascript
// db_schema.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库初始化
const initDatabase = () => {
  const dbPath = path.join(__dirname, 'data', 'routing_data.db');
  const db = new sqlite3.Database(dbPath);
  
  // 创建表结构
  db.serialize(() => {
    // 查询记录表
    db.run(`CREATE TABLE IF NOT EXISTS queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_text TEXT NOT NULL,
      query_hash TEXT NOT NULL,
      language TEXT,
      domain TEXT,
      complexity INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 路由决策表
    db.run(`CREATE TABLE IF NOT EXISTS routing_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_id INTEGER,
      selected_model TEXT NOT NULL,
      confidence INTEGER,
      reasoning TEXT,
      is_successful BOOLEAN,
      response_time INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (query_id) REFERENCES queries(id)
    )`);
    
    // 用户反馈表
    db.run(`CREATE TABLE IF NOT EXISTS user_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routing_decision_id INTEGER,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      comments TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (routing_decision_id) REFERENCES routing_decisions(id)
    )`);
    
    // 模型性能表
    db.run(`CREATE TABLE IF NOT EXISTS model_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      domain TEXT,
      language TEXT,
      success_count INTEGER DEFAULT 0,
      total_count INTEGER DEFAULT 0,
      avg_response_time INTEGER DEFAULT 0,
      avg_rating REAL DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
  
  return db;
};

module.exports = { initDatabase };
```

### 6.3 API接口扩展
```javascript
// 路由API扩展
app.post('/api/routing/analyze', async (req, res) => {
  const { query } = req.body;
  
  try {
    // 获取可用模型
    const availableModels = Object.keys(MODELS)
      .filter(model => MODEL_STATUS[model].available)
      .map(model => ({
        name: model,
        description: MODEL_DESCRIPTIONS[model] || '',
        weight: MODEL_WEIGHTS[model]
      }));
    
    // 获取模型性能统计
    const modelStats = {};
    for (const model of Object.keys(MODEL_STATUS)) {
      modelStats[model] = {
        successRate: MODEL_STATUS[model].successRate,
        averageResponseTime: MODEL_STATUS[model].averageResponseTime,
        requestCount: MODEL_STATUS[model].requestCount
      };
    }
    
    // 使用Llama3进行路由决策
    const decision = await llama3Router.routeQuery(query, availableModels, modelStats);
    
    if (decision) {
      // 记录路由决策
      const queryId = await db.recordQuery(query);
      await db.recordRoutingDecision(queryId, decision.model, decision.confidence, decision.reasoning);
      
      res.json({
        selectedModel: decision.model,
        confidence: decision.confidence,
        reasoning: decision.reasoning
      });
    } else {
      // 回退到规则路由
      const fallbackModel = routeBySemantics([{ role: 'user', content: query }]);
      res.json({
        selectedModel: fallbackModel,
        confidence: 30,
        reasoning: "Llama3路由失败，使用规则路由"
      });
    }
  } catch (error) {
    logger.error('路由分析错误:', error.message);
    res.status(500).json({ error: '路由分析错误', message: error.message });
  }
});

// 用户反馈API
app.post('/api/feedback', async (req, res) => {
  const { queryId, rating, comments } = req.body;
  
  try {
    await db.recordFeedback(queryId, rating, comments);
    // 更新模型性能数据
    await db.updateModelPerformance(queryId, rating);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('记录反馈错误:', error.message);
    res.status(500).json({ error: '记录反馈错误', message: error.message });
  }
});
```

## 7. 实施计划

### 7.1 阶段一：基础设施搭建（1周）
- Ollama环境配置与Llama3模型部署
- 数据库结构设计与初始化
- 基础API接口开发

### 7.2 阶段二：路由引擎开发（1周）
- Llama3路由提示工程与测试
- 特征提取算法实现
- 性能优化与延迟控制

### 7.3 阶段三：学习与反馈系统（1周）
- 数据收集与存储实现
- 反馈界面开发
- 模型专长学习机制开发

### 7.4 阶段四：集成与优化（1周）
- 与现有系统集成
- 性能测试与优化
- 文档与部署指南编写

## 8. 部署与运维

### 8.1 部署步骤
1. 安装Ollama
```bash
# MacOS
curl -fsSL https://ollama.com/install.sh | sh

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

2. 下载并运行Llama3模型
```bash
ollama pull llama3
```

3. 配置数据库
```bash
mkdir -p data
node scripts/init_db.js
```

4. 启动服务
```bash
# 既启动代理服务器又启动管理界面
./start_proxy_system.sh
```

### 8.2 性能监控
- 路由决策延迟监控
- 模型使用分布统计
- 用户反馈统计与分析
- 系统资源使用监控

## 9. 验收标准

### 9.1 路由决策性能
- 智能路由平均决策时间<3秒
- 路由决策准确率>80%（与专家评估一致）
- 系统学习10天后的准确率提升至少10%

### 9.2 用户体验提升
- 模型响应首次成功率提高15%
- 用户反馈满意度提高20%
- 模型专长匹配度提高25%

## 10. 未来扩展计划

### 10.1 短期扩展（1-2个月）
- 个性化用户偏好模型
- A/B测试框架集成
- 批量预测性路由（预加载可能使用的模型）

### 10.2 中期规划（3-6个月）
- 混合响应生成（多模型结果合并）
- 自动化提示优化
- 模型专长自动发现

### 10.3 长期规划（6个月以上）
- 专用路由模型微调
- 开放API生态
- 模型能力自适应学习

## 11. 风险与缓解措施

### 11.1 已识别风险
- Llama3本地部署性能不足
- 路由决策延迟影响用户体验
- 数据不足导致学习效果有限
- 模型能力变化导致历史数据失效

### 11.2 缓解策略
- 设置回退机制，低置信度时使用规则路由
- 实现路由缓存，提高重复查询响应速度
- 初期使用模拟数据加速学习
- 定期重置模型能力数据，确保适应模型更新

---

此方案已针对性选择了Llama3作为本地化路由决策引擎，结合系统现有架构，提供了完整的实施计划和技术方案。通过实现这一智能路由系统，可大幅提升多模型代理的效率，更好地发挥各模型的专长，为用户提供更优质的体验。 
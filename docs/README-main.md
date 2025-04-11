# Solana MEV 机器人

一个专注于 Solana 生态系统中新币监听、抢购和自动卖出套利的 MEV (最大可提取价值) 机器人。

## 项目状态

✅ **已完成全部开发阶段**：机器人已完成全部五个开发阶段，包括基础架构搭建、监听系统、交易分析执行、策略优化风控以及API服务扩展。详细进度请查看[里程碑文档](./docs/milestones.md)。

## 核心功能

- **新币监听**：实时监控多个DEX（Raydium、Orca等）上的新代币池创建
- **代币验证**：通过黑白名单机制和安全评估，过滤可疑代币
- **快速抢购**：检测到机会后立即构建并发送买入交易
- **智能卖出**：根据多种预设策略（止盈/止损/追踪止损）自动执行卖出操作
- **风险控制**：完善的资金管理和风险敞口控制机制
- **性能监控**：全面的系统性能监控，自动识别瓶颈并提供优化建议
- **数据分析**：交易绩效分析与策略优化建议
- **自适应策略**：根据市场状态自动切换最优交易策略
- **API服务**：独立的HTTP API接口，用于管理黑白名单

## 技术架构

- **编程语言**：TypeScript/JavaScript
- **核心依赖**：
  - @solana/web3.js - Solana 区块链交互
  - Raydium/Orca SDK - DEX 交互
  - Jupiter API - 最优交易路由
  - Express - API服务器框架
  - Winston - 日志系统
  - node-telegram-bot-api - 通知系统

## 项目结构

```
solana_mevbot/
├── .env                      # 环境变量配置文件
├── .env.example              # 环境变量示例文件
├── tsconfig.json             # TypeScript配置
├── package.json              # 项目依赖和脚本
├── start_api_server.js       # API服务器独立启动脚本
├── apidoc.json               # API文档配置
│
├── src/                      # 源代码目录
│   ├── index.ts              # 主入口文件
│   ├── api-server.ts         # API服务器入口文件
│   │
│   ├── core/                 # 核心配置和类型
│   │   ├── config.ts         # 配置管理
│   │   ├── logger.ts         # 日志系统
│   │   └── types.ts          # 类型定义
│   │
│   ├── modules/              # 功能模块
│   │   ├── analyzer/         # 分析模块
│   │   │   ├── opportunity_detector.ts  # 机会检测
│   │   │   └── token_validator.ts       # 代币验证
│   │   │
│   │   ├── listener/         # 监听模块
│   │   │   ├── pool_monitor.ts          # 池子监控
│   │   │   └── event_detector.ts        # 事件检测
│   │   │
│   │   ├── monitor/          # 监控模块
│   │   │   ├── performance_monitor.ts   # 性能监控
│   │   │   └── health_checker.ts        # 健康检查
│   │   │
│   │   ├── risk/             # 风险控制模块
│   │   │   ├── risk_manager.ts          # 风险管理
│   │   │   └── fund_manager.ts          # 资金管理
│   │   │
│   │   ├── strategy/         # 策略模块
│   │   │   ├── strategy_manager.ts      # 策略管理器
│   │   │   └── adaptive_strategy.ts     # 自适应策略
│   │   │
│   │   └── trader/           # 交易模块
│   │       ├── trade_executor.ts        # 交易执行器
│   │       ├── trade_builder.ts         # 交易构建
│   │       └── position_manager.ts      # 持仓管理
│   │
│   ├── api/                  # API服务器模块
│   │   ├── server.ts         # API服务器
│   │   ├── controllers/      # API控制器
│   │   │   └── token_controller.ts      # 代币控制器
│   │   ├── routes/           # API路由
│   │   │   └── token_routes.ts          # 代币路由
│   │   ├── middleware/       # API中间件
│   │   │   └── error_handler.ts         # 错误处理
│   │   └── header.md, footer.md, etc.   # API文档片段
│   │
│   ├── services/             # 外部服务
│   │   ├── rpc_service.ts    # RPC服务
│   │   ├── notification.ts   # 通知服务
│   │   └── dex/              # DEX服务
│   │       ├── raydium.ts    # Raydium接口
│   │       └── orca.ts       # Orca接口
│   │
│   └── utils/                # 工具函数
│       ├── solana.ts         # Solana工具
│       └── helpers.ts        # 通用工具
│
├── config/                   # 配置文件
│   ├── default.json          # 默认配置
│   ├── blacklist.json        # 黑名单配置
│   └── whitelist.json        # 白名单配置
│
├── data/                     # 数据存储
│   └── transactions/         # 交易记录
│
├── logs/                     # 日志文件
│   ├── bot_run.log           # 主程序日志
│   └── api.log               # API服务器日志
│
├── scripts/                  # 脚本工具
│   ├── deploy.sh             # 部署脚本
│   └── test_api.js           # API测试脚本
│
├── tests/                    # 测试代码
│   ├── unit/                 # 单元测试
│   └── integration/          # 集成测试
│
└── docs/                     # 文档
    ├── API_README.md         # API使用文档
    └── milestones.md         # 项目里程碑
```

## 环境要求

- Node.js 18+
- Solana CLI (可选，用于本地测试)
- 高性能 RPC 节点访问权限
- Helius API 密钥（推荐用于高性能监听）

## 文档

完整的项目文档已整理到[docs](./docs)目录中，包括：

- [项目分析报告](./docs/report.md) - 详细的技术实现分析
- [项目里程碑](./docs/milestones.md) - 开发阶段和里程碑记录
- [API使用文档](./docs/API_README.md) - API服务器使用指南

查看[文档中心](./docs/README.md)获取更多信息。

## 安装步骤

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/solana_mevbot.git
cd solana_mevbot
```

2. 安装依赖：
```bash
npm install
```

3. 构建项目：
```bash
npm run build
```

4. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 RPC URL、钱包私钥等信息
```

5. 配置交易参数：
```bash
# 编辑 config/default.json 文件，调整策略参数
```

## 使用说明

### 主程序

1. 启动机器人（完整模式）：
```bash
npm run start
```

2. 仅监听模式（不执行交易）：
```bash
npm run start:listen-only
```

3. 测试连接：
```bash
npm run test:connection
```

### API服务器

1. 随主程序启动API服务器：
在`.env`中设置`ENABLE_API_SERVER=true`，然后启动主程序

2. 独立启动API服务器：
```bash
npm run api:only
```

3. 测试API服务器：
```bash
npm run test:api
```

API服务器提供完整的黑白名单管理功能，详情请查看[API文档](./docs/API_README.md)。

## 最新更新 (v5.0.0)

- 增加了独立的API服务器，支持通过HTTP接口管理黑白名单
- 添加了自适应交易策略框架，能根据市场状态自动选择最优策略
- 改进了风险控制系统，支持更精细的资金管理和风险敞口控制
- 实现了完整的性能监控系统，自动识别瓶颈并提供优化建议
- 开发了数据分析报告系统，提供决策支持和策略优化建议

## 安全提示

- **私钥安全**：确保你的钱包私钥安全存储，建议使用环境变量
- **资金管理**：建议仅使用小额资金进行测试，了解风险后再增加投入
- **风险控制**：调整好止损参数，避免大幅亏损
- **测试优先**：在使用真实资金前，先在测试网络或小额环境测试
- **API安全**：API服务器默认无身份验证，生产环境中应添加安全措施

## 贡献指南

欢迎贡献代码或提出问题！请遵循以下步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 免责声明

本项目仅用于教育和研究目的。使用本软件进行交易操作风险自负。开发者不对任何资金损失或其他风险负责。请确保你理解加密货币交易的风险，并遵守当地法律法规。 
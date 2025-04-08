# Solana MEV 机器人

一个专注于 Solana 生态系统中新币监听、抢购和自动卖出套利的 MEV (最大可提取价值) 机器人。

## 项目进展

项目当前处于已完成状态，已实现基础架构搭建、监听系统、交易分析执行和策略优化风控四个核心阶段。详细的开发进度和里程碑记录请查看[里程碑文档](./milestones.md)。

## 功能简介

该机器人主要实现以下功能：

- **新币监听**：实时监控 Raydium、Orca 等 DEX 上的新代币池创建
- **快速抢购**：检测到机会后立即构建并发送买入交易
- **智能卖出**：根据预设策略（止盈/止损）自动执行卖出操作
- **风险控制**：通过白名单/黑名单机制过滤可疑代币
- **性能优化**：低延迟交易执行，支持 Jito MEV 网络优先级提升
- **数据分析**：交易绩效监控与策略优化建议
- **自适应策略**：根据市场状态自动切换最优交易策略

## 技术架构

- **编程语言**：TypeScript/JavaScript
- **核心依赖**：
  - @solana/web3.js - Solana 区块链交互
  - Raydium/Orca SDK - DEX 交互
  - Jupiter API - 最优交易路由

## 项目结构

```
solana_mevbot/
├── src/                     # 源代码目录
│   ├── core/                # 核心配置和类型
│   ├── modules/             # 功能模块
│   │   ├── analyzer/        # 分析模块(代币验证、机会检测、数据分析)
│   │   ├── listener/        # 监听模块(池子监控)
│   │   ├── monitor/         # 监控模块(性能监控)
│   │   ├── risk/            # 风险控制模块
│   │   ├── strategy/        # 策略模块(自适应策略)
│   │   └── trader/          # 交易模块(执行买入/卖出)
│   ├── utils/               # 工具函数
│   ├── services/            # 外部服务
│   └── index.ts             # 入口文件
├── config/                  # 配置文件
├── scripts/                 # 脚本工具
└── test/                    # 测试代码
```

## 环境要求

- Node.js 18+
- Solana CLI (可选，用于本地测试)
- 高性能 RPC 节点访问权限
- Helius API 密钥（推荐用于高性能监听）

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

3. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 RPC URL、钱包私钥等信息
```

4. 配置交易参数：
```bash
# 编辑 config/default.json 文件，调整策略参数
```

## 使用说明

1. 启动机器人：
```bash
npm run start
```

2. 仅监听模式（不执行交易）：
```bash
npm run start --listen-only
```

3. 测试连接：
```bash
npm run test:connection
```

## 最新更新 (v4.0.0)

- 添加了自适应交易策略框架，能根据市场状态自动选择最优策略
- 改进了风险控制系统，支持更精细的资金管理和风险敞口控制
- 实现了完整的性能监控系统，自动识别瓶颈并提供优化建议
- 开发了数据分析报告系统，提供决策支持和策略优化建议

## 安全提示

- **私钥安全**：确保你的钱包私钥安全存储，建议使用环境变量
- **资金管理**：建议仅使用小额资金进行测试，了解风险后再增加投入
- **风险控制**：调整好止损参数，避免大幅亏损
- **测试优先**：在使用真实资金前，先在测试网络或小额环境测试

## 贡献指南

欢迎贡献代码或提出问题！请遵循以下步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 免责声明

本项目仅用于教育和研究目的。使用本软件进行交易操作风险自负。开发者不对任何资金损失或其他风险负责。请确保你理解加密货币交易的风险，并遵守当地法律法规。 
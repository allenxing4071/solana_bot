# Solana MEV 机器人

一个专注于 Solana 生态系统中新币监听、抢购和自动卖出套利的 MEV (最大可提取价值) 机器人。

## 项目进展

项目当前处于开发阶段，已完成基础架构搭建和监听系统实现。详细的开发进度和里程碑记录请查看[里程碑文档](./milestones.md)。

## 功能简介

该机器人主要实现以下功能：

- **新币监听**：实时监控 Raydium、Orca 等 DEX 上的新代币池创建
- **快速抢购**：检测到机会后立即构建并发送买入交易
- **智能卖出**：根据预设策略（止盈/止损）自动执行卖出操作
- **风险控制**：通过白名单/黑名单机制过滤可疑代币
- **性能优化**：低延迟交易执行，支持 Jito MEV 网络优先级提升

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
npm run start:listen-only
```

3. 测试连接：
```bash
npm run test:connection
```

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
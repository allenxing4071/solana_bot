# Solana MEV机器人项目

## 项目概述

Solana MEV (最大可提取价值) 机器人是一个专注于新币监听、快速抢购和自动卖出的套利系统。机器人通过监听 Solana 上主要的去中心化交易所(DEX)合约，实时检测新代币/交易池的创建，并在发现潜在机会时快速执行买入交易，然后根据预设的策略条件自动进行卖出操作，实现利润最大化。

## 核心功能

- **实时监听**：监听DEX合约上的新池子创建事件
- **智能分析**：对新币进行验证和风险评估
- **自动交易**：构建并执行最优买入/卖出交易
- **策略管理**：支持多种交易策略（止盈/止损/追踪止损）
- **风险控制**：完善的代币黑白名单和安全评估机制
- **性能监控**：实时监控系统状态和交易执行情况

## 项目里程碑

### 阶段一：基础架构搭建（已完成）

#### 核心成果：
- ✅ 完成项目初始化和基本目录结构
- ✅ 搭建TypeScript开发环境与配置文件
- ✅ 实现RPC服务连接管理系统
  - 支持HTTP和WebSocket双通道连接
  - 实现连接失败自动切换备用节点
  - 集成重试机制和错误处理
- ✅ 完成日志系统设计与实现

### 阶段二：监听系统实现（已完成）

#### 核心成果：
- ✅ 设计并实现交易池监控器(PoolMonitor)
  - 支持多DEX(Raydium, Orca等)的同时监听
  - 集成事件订阅和实时日志分析
  - 实现新池子检测和处理逻辑
- ✅ 实现基于WebSocket的高效订阅系统
- ✅ 定期轮询机制作为备份检测方式

### 阶段三：交易分析与执行（已完成）

#### 核心成果：
- ✅ 实现代币验证器(TokenValidator)
- ✅ 设计并实现机会检测器(OpportunityDetector)
- ✅ 开发交易执行器(TradeExecutor)
- ✅ 实现交易策略管理器(StrategyManager)

### 阶段四：策略优化与风控（已完成）

#### 核心成果：
- ✅ 自适应交易策略框架
- ✅ 风险控制与资金管理系统
- ✅ 性能优化与监控系统
- ✅ 数据分析与报告系统

### 阶段五：API服务扩展（已完成）

#### 核心成果：
- ✅ 设计并实现独立API服务器
- ✅ 扩展代币验证功能
- ✅ 优化服务启动和管理

## 环境要求

### 系统要求
- 操作系统: Linux (推荐 Ubuntu 20.04+), macOS 12+, Windows 10/11 (WSL2)
- 内存: 最低4GB，推荐8GB+
- 存储: 至少1GB可用空间
- 网络: 稳定的互联网连接

### 软件要求
- Node.js >= 16.x (推荐18.x或20.x LTS版本)
- npm >= 8.x
- Git >= 2.25

### Solana相关要求
- Solana CLI >= 1.9.0（可选）
- RPC节点访问（必需，可以使用公共节点或私有节点）

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/your-repo/solana-mev-bot.git
cd solana-mev-bot
```

### 2. 安装依赖项

```bash
npm install
```

### 3. 配置环境变量

复制示例环境配置文件并根据需要修改：

```bash
cp .env.example .env
```

必须配置的环境变量：

```
# Solana网络配置
SOLANA_RPC_URL=https://your-rpc-node-url.com    # 必填: RPC节点地址
SOLANA_WS_URL=wss://your-ws-node-url.com        # 必填: WebSocket节点地址

# 钱包配置 (非只读模式必填)
WALLET_PRIVATE_KEY=YOUR_PRIVATE_KEY             # 钱包私钥
```

### 4. 构建项目

```bash
npm run build
```

### 5. 验证安装

运行简单的连接测试，确认可以连接到Solana网络：

```bash
npm run test:connection
```

## 运行模式

机器人支持以下运行模式：

### 完整模式

启动完整的MEV机器人，包括监听、分析和执行交易：

```bash
npm run start
```

### 仅监听模式

只监听新池子/交易机会，但不执行任何交易（用于测试和分析）：

```bash
npm run start:listen-only
```

### 仅API服务

只启动API服务器，提供黑白名单管理接口：

```bash
npm run api:only
```

## 常见问题排查

### 连接问题

**问题**: 无法连接到Solana网络
**解决方案**:
- 检查RPC节点URL是否正确
- 确认网络连接是否稳定
- 尝试使用备用RPC节点（在`.env`中配置`BACKUP_RPC_ENDPOINTS`）

```bash
# 检查RPC连接
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' YOUR_RPC_URL
```

### 交易失败

**问题**: 交易始终失败或超时
**解决方案**:
- 检查钱包余额是否充足
- 增加交易超时时间（`TX_CONFIRM_TIMEOUT`）
- 调整滑点设置（`MAX_BUY_SLIPPAGE`/`MAX_SELL_SLIPPAGE`）
- 增加交易优先级费用（`TX_PRIORITY_FEE`）

### 内存问题

**问题**: 程序内存使用过高或逐渐增加
**解决方案**:
- 定期重启服务
- 调整`NODE_OPTIONS`环境变量增加最大内存使用量
- 启用垃圾回收日志以识别内存泄漏

```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run start
```

### API服务问题

**问题**: API服务无法启动或无法访问
**解决方案**:
- 检查端口是否被占用（默认8080）
- 确认防火墙设置是否允许该端口访问
- 检查日志文件中的详细错误信息

## 日志和监控

### 日志位置

默认情况下，日志文件存储在`logs/`目录：
- `logs/YYYY-MM-DD-app.log` - 主程序日志
- `logs/YYYY-MM-DD-error.log` - 错误日志

### 监控指标

可以通过访问以下API获取系统监控指标：
- `/api/system/status` - 系统状态
- `/api/memory_stats.json` - 内存使用统计

## 生产环境部署

对于生产环境部署，建议以下安全措施：

1. 使用process manager（如PM2）管理进程
2. 启用API密钥认证
3. 配置防火墙规则，只允许必要的端口访问
4. 使用HTTPS而非HTTP
5. 定期备份配置和数据

PM2启动示例：
```bash
# 安装PM2
npm install -g pm2

# 使用PM2启动
pm2 start dist/index.js --name "solana-mev-bot" -- --config=/path/to/config.json

# 设置开机自启
pm2 save
pm2 startup
```

## 配置说明

主要配置参数在 `.env`
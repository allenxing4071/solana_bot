# Solana MEV 机器人配置与技术参考

## 1. 配置系统

### 环境配置 (.env 文件)

Solana MEV 机器人使用 `.env` 文件进行主要配置。以下是核心配置参数：

```
# 基本配置
NODE_ENV=production                       # 运行环境 (development/production)
APP_NAME=Solana MEV Bot                   # 应用名称
LOG_LEVEL=info                            # 日志级别 (debug/info/warn/error)

# Solana 网络配置
RPC_ENDPOINT=https://api.mainnet-beta.solana.com  # 主RPC节点
BACKUP_RPC_ENDPOINTS=https://solana-api.projectserum.com,https://rpc.ankr.com/solana  # 备用RPC节点
WEBSOCKET_ENDPOINT=wss://api.mainnet-beta.solana.com  # WebSocket端点

# 钱包配置
WALLET_PRIVATE_KEY=YOUR_PRIVATE_KEY       # 钱包私钥
WALLET_ADDRESS=YOUR_WALLET_ADDRESS        # 钱包地址

# 交易配置
LISTEN_ONLY=false                         # 是否仅监听模式 (true/false)
MAX_TRADE_SOL_AMOUNT=0.5                  # 单笔交易最大SOL金额
MIN_TRADE_SOL_AMOUNT=0.01                 # 单笔交易最小SOL金额
MAX_PENDING_TXS=3                         # 最大挂起交易数
TX_TIMEOUT_MS=30000                       # 交易超时时间(毫秒)
SLIPPAGE_PERCENT=3                        # 滑点百分比

# API服务配置
API_PORT=8080                             # API服务器端口
API_HOST=127.0.0.1                        # API服务器主机
API_ENABLE_CORS=true                      # 是否启用CORS
API_KEY=your_secure_api_key               # API访问密钥

# 监控配置
TELEGRAM_BOT_TOKEN=                       # Telegram机器人Token
TELEGRAM_CHAT_ID=                         # Telegram聊天ID
ENABLE_NOTIFICATIONS=true                 # 是否启用通知
```

### 黑白名单配置

黑白名单配置用于过滤代币，提供额外的安全层。配置文件位于 `config/` 目录。

#### 白名单配置 (whitelist.json)

```json
{
  "tokens": [
    {
      "address": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "name": "Wrapped SOL",
      "reason": "Native token",
      "addedAt": "2023-01-01T00:00:00Z"
    },
    {
      "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "symbol": "USDC",
      "name": "USD Coin",
      "reason": "Stablecoin",
      "addedAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

#### 黑名单配置 (blacklist.json)

```json
{
  "tokens": [
    {
      "address": "BlacklistedToken123456789",
      "symbol": "SCAM",
      "name": "ScamToken",
      "reason": "Honeypot",
      "addedAt": "2023-12-01T12:00:00Z"
    },
    {
      "address": "BlacklistedToken987654321",
      "symbol": "RUG",
      "name": "RugPullToken",
      "reason": "Known scam project",
      "addedAt": "2023-12-05T10:30:00Z"
    }
  ],
  "patterns": [
    {
      "pattern": ".*SCAM.*",
      "field": "name",
      "reason": "Contains 'SCAM' in name",
      "addedAt": "2023-12-01T12:00:00Z"
    },
    {
      "pattern": ".*ELON.*",
      "field": "symbol",
      "reason": "Celebrity name token",
      "addedAt": "2023-12-05T10:30:00Z"
    }
  ],
  "creators": [
    {
      "address": "MaliciousCreator123456789",
      "reason": "Known scammer",
      "addedAt": "2023-12-01T12:00:00Z"
    }
  ]
}
```

## 2. 技术架构

### 系统架构图

```
┌────────────────────────────────────────────────────────┐
│                      配置管理                           │
└───────────────┬────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────┐
│                     核心引擎                            │
├───────────┬───────────┬────────────┬─────────┬─────────┤
│  监听模块  │  分析模块  │  交易模块   │ 策略模块 │ 监控模块 │
└───────────┴───────────┴────────────┴─────────┴─────────┘
                │                      ▲
                │                      │
┌───────────────▼──────────┐   ┌──────┴─────────────────┐
│      区块链交互层          │   │      数据存储层         │
└───────────────┬──────────┘   └──────┬─────────────────┘
                │                      │
┌───────────────▼──────────────────────▼─────────────────┐
│                     API服务器                           │
└────────────────────────────────────────────────────────┘
```

### 关键技术模块

#### 1. 监听模块
- 使用WebSocket监听DEX合约事件
- 支持多种DEX的新池创建事件监听
- 使用轮询作为备用机制

#### 2. 分析模块
- 代币验证和安全评分
- 流动性分析和风险评估
- 代币元数据获取和分析

#### 3. 交易模块
- 交易构建和优化
- 交易执行和确认
- 错误处理和重试机制

#### 4. 策略模块
- 多策略支持(止盈/止损/追踪止损)
- 资金分配和风险管理
- 自适应策略切换

#### 5. 监控模块
- 系统健康监控
- 性能指标收集
- 异常检测和告警

## 3. 性能优化与安全措施

### 性能优化

1. **RPC连接优化**
   - 连接池管理
   - 自动故障转移
   - 请求批处理

2. **内存优化**
   - 定期垃圾回收
   - 数据结构优化
   - 内存使用监控

3. **交易优化**
   - 交易指令优化
   - 预签名交易
   - 并行交易构建

### 安全措施

1. **代币安全**
   - 多维度代币验证
   - 黑白名单过滤
   - 代码分析和风险评分

2. **资金安全**
   - 交易限额控制
   - 资金分配策略
   - 紧急停止机制

3. **系统安全**
   - API访问控制
   - 输入验证
   - 错误处理和日志

## 4. 代币验证流程

### 验证层级

1. **基础验证** (速度优先)
   - 代币地址检查
   - 黑白名单匹配
   - 基本元数据验证

2. **中级验证** (平衡速度和安全)
   - 合约检查
   - 流动性评估
   - 持币地址分析

3. **深度验证** (安全优先)
   - 代码分析
   - 创建者背景检查
   - 交易模式分析

### 验证决策流程

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  基础验证通过  │────▶│  中级验证通过  │────▶│  深度验证通过  │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  低风险交易   │     │  中风险交易    │     │  高风险交易    │
│ (完全自动执行) │     │ (根据策略执行) │     │ (需手动确认)   │
└───────────────┘     └───────────────┘     └───────────────┘
```

## 5. 故障排除

### 常见问题与解决方案

| 问题描述 | 可能原因 | 解决方案 |
|---------|---------|---------|
| 机器人无法连接RPC节点 | RPC节点不可用或配置错误 | 检查网络连接和RPC配置，尝试切换备用节点 |
| 无法监听到新池创建 | WebSocket连接断开或DEX合约更新 | 重启WebSocket连接，更新DEX合约地址 |
| 交易执行失败 | 滑点过大、余额不足或网络拥堵 | 调整滑点设置，检查余额，在交易确认前增加延迟 |
| API服务器无法启动 | 端口占用或配置错误 | 更改端口设置，检查API配置 |
| 内存使用过高 | 数据缓存过多或内存泄漏 | 调整缓存策略，检查代码中的内存泄漏 |

### 日志分析

系统使用分级日志记录所有重要操作。日志文件位于 `logs/` 目录：

- `bot_run.log`: 主程序运行日志
- `api.log`: API服务器日志
- `transactions.log`: 交易执行日志
- `errors.log`: 错误日志

日志级别可在 `.env` 文件中通过 `LOG_LEVEL` 参数设置。

## 6. 高级配置

### 策略配置 (strategy.json)

```json
{
  "default": {
    "takeProfit": {
      "enabled": true,
      "percentage": 50,
      "trailingStop": {
        "enabled": true,
        "activationPercentage": 20,
        "trailingPercentage": 10
      }
    },
    "stopLoss": {
      "enabled": true,
      "percentage": 15
    },
    "timeLimit": {
      "enabled": true,
      "maxHoldingMinutes": 60
    }
  },
  "aggressive": {
    "takeProfit": {
      "enabled": true,
      "percentage": 100,
      "trailingStop": {
        "enabled": true,
        "activationPercentage": 30,
        "trailingPercentage": 15
      }
    },
    "stopLoss": {
      "enabled": true,
      "percentage": 25
    },
    "timeLimit": {
      "enabled": true,
      "maxHoldingMinutes": 120
    }
  },
  "conservative": {
    "takeProfit": {
      "enabled": true,
      "percentage": 30,
      "trailingStop": {
        "enabled": true,
        "activationPercentage": 15,
        "trailingPercentage": 5
      }
    },
    "stopLoss": {
      "enabled": true,
      "percentage": 10
    },
    "timeLimit": {
      "enabled": true,
      "maxHoldingMinutes": 30
    }
  }
}
```

### DEX配置 (dex.json)

```json
{
  "raydium": {
    "programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "amm": {
      "programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
      "serumProgramId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    }
  },
  "orca": {
    "programId": "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP"
  },
  "jupiter": {
    "enabled": true,
    "apiUrl": "https://quote-api.jup.ag/v6"
  }
}
```

---

*最后更新时间: 2024年4月* 
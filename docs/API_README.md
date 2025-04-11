# Solana MEV Bot API 服务器

## 📖 概述

API服务器为Solana MEV机器人提供了一套完整的HTTP接口，用于管理代币的黑名单和白名单、监控流动性池、记录交易、系统状态监控和配置设置等功能。它可以**独立于主要的MEV机器人运行**，使用文件持久化存储数据，便于集成到其他系统或前端应用。

## 🌟 功能特点

```
┌─────────────────────────────┐
│       API服务器核心功能       │
├─────────────┬───────────────┤
│ 黑名单管理    │ 获取/添加/删除  │
├─────────────┼───────────────┤
│ 白名单管理    │ 获取/添加/删除  │
├─────────────┼───────────────┤
│ 代币管理      │ 列表/详情/验证  │
├─────────────┼───────────────┤
│ 流动性池监控   │ 列表/详情/统计  │
├─────────────┼───────────────┤
│ 交易记录      │ 记录/详情/统计  │
├─────────────┼───────────────┤
│ 系统监控      │ 状态/内存/控制  │
├─────────────┼───────────────┤
│ 设置管理      │ 获取/更新/应用  │
├─────────────┼───────────────┤
│ 健康检查      │ 服务器状态监控  │
├─────────────┼───────────────┤
│ 错误处理      │ 标准化错误响应  │
├─────────────┼───────────────┤
│ 日志记录      │ 操作追踪       │
├─────────────┼───────────────┤
│ CORS支持     │ 跨域资源共享    │
└─────────────┴───────────────┘
```

## 🔧 安装和配置

API服务器是Solana MEV Bot的一部分，在安装Bot的同时已经安装。

### 环境配置

1. 在`.env`文件中设置以下变量：
```
API_PORT=3000            # API服务器端口 (默认: 3000)
ENABLE_API_SERVER=true   # 是否启用API服务器
```

### 文件路径配置

确认黑名单和白名单文件路径配置正确（在`appConfig`中）：
```javascript
security: {
  tokenValidation: {
    blacklistPath: './config/blacklist.json',
    whitelistPath: './config/whitelist.json'
  }
}
```

## 🚀 启动服务器

### 作为独立服务启动

```bash
# 使用NPM脚本启动
npm run api:only

# 或直接使用Node启动
node start_api_server.js
```

### 随MEV Bot一起启动

只需在启动MEV Bot时确保`.env`文件中的`ENABLE_API_SERVER=true`即可：

```bash
npm run start
```

## 📚 API端点

### 系统接口

#### 健康检查

- **GET /api/health**
  - 描述: 检查API服务器是否正常运行
  - 响应: `{"status": "ok", "timestamp": "2023-07-01T12:00:00.000Z"}`

#### 获取系统状态

- **GET /api/system/status**
  - 描述: 获取系统运行状态、CPU使用率、内存使用率和运行时间等信息
  - 响应:
  ```json
  {
    "success": true,
    "data": {
      "status": "running",  // 或 "stopped"
      "uptime": "3小时15分钟",
      "cpu": {
        "usage": 32.5,
        "cores": 8
      },
      "memory": {
        "total": 8192,
        "used": 3200,
        "free": 4992,
        "usagePercent": 39.1
      },
      "lastUpdated": "2023-11-26T15:32:45.000Z"
    }
  }
  ```

#### 启动系统

- **POST /api/system/start**
  - 描述: 启动MEV机器人系统
  - 响应:
  ```json
  {
    "success": true,
    "message": "系统已成功启动",
    "data": {
      "status": "running",
      "startTime": "2023-11-26T15:32:45.000Z"
    }
  }
  ```

#### 停止系统

- **POST /api/system/stop**
  - 描述: 停止MEV机器人系统
  - 响应:
  ```json
  {
    "success": true,
    "message": "系统已成功停止",
    "data": {
      "status": "stopped",
      "stopTime": "2023-11-26T15:32:45.000Z"
    }
  }
  ```

#### 优化内存

- **POST /api/system/optimize-memory**
  - 描述: 触发内存优化程序，释放未使用内存
  - 响应:
  ```json
  {
    "success": true,
    "message": "内存优化已完成",
    "data": {
      "before": {
        "heapUsed": 1200,
        "heapTotal": 2048
      },
      "after": {
        "heapUsed": 950,
        "heapTotal": 2048
      },
      "saved": 250
    }
  }
  ```

#### 获取内存统计

- **GET /api/system/memory-stats**
  - 描述: 获取详细的内存使用统计数据
  - 响应:
  ```json
  {
    "success": true,
    "data": {
      "system": {
        "total": 8192,
        "free": 4992,
        "used": 3200,
        "usedPercent": 39.1
      },
      "process": {
        "rss": 1200,
        "heapTotal": 2048,
        "heapUsed": 950,
        "external": 120,
        "arrayBuffers": 65
      },
      "history": [
        {"timestamp": "2023-11-26T15:00:00.000Z", "heapUsed": 920},
        {"timestamp": "2023-11-26T15:10:00.000Z", "heapUsed": 940},
        {"timestamp": "2023-11-26T15:20:00.000Z", "heapUsed": 935}
      ],
      "peak": {
        "value": 1200,
        "timestamp": "2023-11-26T14:45:00.000Z"
      }
    }
  }
  ```

### 设置接口

#### 获取系统设置

- **GET /api/settings**
  - 描述: 获取系统的当前设置
  - 响应:
  ```json
  {
    "success": true,
    "data": {
      "general": {
        "botName": "Solana MEV Bot",
        "logLevel": "info",
        "maxMemory": 2048,
        "operationMode": "auto",
        "enableStats": true
      },
      "network": {
        "primaryRpc": "https://api.mainnet-beta.solana.com",
        "backupRpc": "https://solana-api.projectserum.com",
        "wsEndpoint": "wss://api.mainnet-beta.solana.com",
        "connectionTimeout": 10000,
        "useJitoRelay": false,
        "jitoRelayUrl": "https://relay.jito.wtf/relay"
      },
      "wallet": {
        "walletType": "keypair",
        "walletAddress": "WalletAddress111111111111111111111111111111",
        "maxTradeAmount": 5.0,
        "maxDailyTradeVolume": 50.0
      },
      "trading": {
        "enabled": true,
        "maxSlippage": 1.0,
        "minProfitPercent": 0.5,
        "timeoutMs": 10000,
        "gasMultiplier": 1.2,
        "strategies": [
          {
            "name": "arbitrage",
            "enabled": true,
            "minProfit": 0.8
          },
          {
            "name": "mevExtraction",
            "enabled": true,
            "minProfit": 1.2
          }
        ]
      },
      "notifications": {
        "email": {
          "enabled": false,
          "address": "user@example.com",
          "onSuccess": false,
          "onError": true
        },
        "telegram": {
          "enabled": false,
          "chatId": "123456789",
          "botToken": "bot_token_here"
        },
        "discord": {
          "enabled": true,
          "webhookUrl": "https://discord.com/api/webhooks/..."
        }
      },
      "advanced": {
        "debugMode": false,
        "experimentalFeatures": false,
        "customRpcHeaders": {},
        "memoryOptimization": {
          "enabled": true,
          "interval": 3600000,
          "threshold": 70
        }
      }
    }
  }
  ```

#### 更新系统设置

- **POST /api/settings**
  - 描述: 更新系统设置
  - 请求体: 与GET /api/settings响应中的data部分结构相同，可以只包含要更新的部分
  - 响应:
  ```json
  {
    "success": true,
    "message": "设置已更新",
    "data": {
      "updatedFields": ["network.primaryRpc", "trading.maxSlippage"],
      "requiresRestart": false
    }
  }
  ```

#### 应用设置更改

- **POST /api/settings/apply**
  - 描述: 应用已更新的设置，可能需要重启某些组件
  - 请求体:
  ```json
  {
    "restart": true  // 可选，是否在需要时重启系统组件
  }
  ```
  - 响应:
  ```json
  {
    "success": true,
    "message": "设置已成功应用",
    "data": {
      "appliedAt": "2023-11-26T15:45:30.000Z",
      "restartedComponents": ["tradingEngine", "networkManager"],
      "status": "applied"
    }
  }
  ```

### 代币接口

#### 获取所有代币

- **GET /api/tokens**
  - 描述: 获取所有监控中的代币列表
  - 查询参数: 
    - `limit`: 每页数量，默认为20
    - `page`: 页码，默认为1
    - `sort`: 排序方式，可选值 "name", "symbol", "date", "risk"，默认为"date"
    - `order`: 排序顺序，可选值 "asc", "desc"，默认为"desc"
  - 响应:
  ```json
  {
    "success": true,
    "count": 120,
    "page": 1,
    "limit": 20,
    "data": [
      {
        "mint": "ExampleToken111111111111111111111111111",
        "symbol": "EXT",
        "name": "Example Token",
        "price": 0.12,
        "liquidity": 245000,
        "riskScore": 2.5,
        "discoveryTime": "2023-11-25T12:34:56.000Z",
        "isBlacklisted": false,
        "isWhitelisted": false
      },
      // ... 更多代币
    ]
  }
  ```

#### 获取代币详情

- **GET /api/tokens/details**
  - 描述: 获取特定代币的详细信息
  - 查询参数: `mint` - 代币Mint地址
  - 响应:
  ```json
  {
    "success": true,
    "data": {
      "mint": "ExampleToken111111111111111111111111111",
      "symbol": "EXT",
      "name": "Example Token",
      "price": {
        "current": 0.12,
        "change24h": 5.2,
        "history": [
          {"timestamp": "2023-11-25T12:00:00.000Z", "price": 0.11},
          {"timestamp": "2023-11-25T18:00:00.000Z", "price": 0.115},
          {"timestamp": "2023-11-26T00:00:00.000Z", "price": 0.12}
        ]
      },
      "liquidity": 245000,
      "volume24h": 56000,
      "marketCap": 1200000,
      "holders": 1250,
      "riskAnalysis": {
        "score": 2.5,
        "factors": [
          {"name": "代码安全", "score": 3.2},
          {"name": "流动性", "score": 2.1},
          {"name": "开发者活跃度", "score": 2.3}
        ]
      },
      "metadata": {
        "decimals": 9,
        "creator": "Creator111111111111111111111111111111111",
        "creationTime": "2023-10-15T14:25:36.000Z"
      },
      "status": {
        "isBlacklisted": false,
        "isWhitelisted": false,
        "isMonitored": true
      }
    }
  }
  ```

#### 获取所有代币

- **GET /api/tokens/all**
  - 描述: 获取所有代币，包括白名单、黑名单和监控中的代币
  - 响应:
  ```json
  {
    "success": true,
    "count": {
      "total": 150,
      "whitelist": 20,
      "blacklist": 10,
      "monitored": 120
    },
    "data": {
      "whitelist": [
        {
          "mint": "ExampleGoodToken22222222222222222222222",
          "symbol": "GOOD",
          "name": "Good Token Example",
          "trusted": true
        },
        // ... 更多白名单代币
      ],
      "blacklist": [
        {
          "mint": "ExampleBadToken111111111111111111111111111",
          "symbol": "SCAM",
          "name": "Scam Token Example",
          "reason": "已知诈骗项目"
        },
        // ... 更多黑名单代币
      ],
      "monitored": [
        {
          "mint": "ExampleToken111111111111111111111111111",
          "symbol": "EXT",
          "name": "Example Token",
          "riskScore": 2.5
        },
        // ... 更多监控中的代币
      ]
    }
  }
  ```

#### 获取黑名单

- **GET /api/tokens/blacklist**
  - 描述: 获取所有黑名单代币
  - 响应: 
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "mint": "ExampleBadToken111111111111111111111111111",
        "symbol": "SCAM",
        "name": "Scam Token Example",
        "reason": "已知诈骗项目"
      }
    ]
  }
  ```

#### 添加到黑名单

- **POST /api/tokens/blacklist**
  - 描述: 添加代币到黑名单
  - 请求体: 
  ```json
  {
    "mint": "ExampleBadToken111111111111111111111111111",
    "symbol": "SCAM",
    "name": "Scam Token Example",
    "reason": "已知诈骗项目"
  }
  ```
  - 响应: 
  ```json
  {
    "success": true,
    "message": "代币已成功添加到黑名单",
    "data": {
      "mint": "ExampleBadToken111111111111111111111111111",
      "symbol": "SCAM", 
      "name": "Scam Token Example",
      "reason": "已知诈骗项目"
    }
  }
  ```

#### 从黑名单删除

- **DELETE /api/tokens/blacklist/:mint**
  - 描述: 从黑名单移除代币
  - 参数: `mint` - 代币Mint地址
  - 响应: 
  ```json
  {
    "success": true,
    "message": "代币已从黑名单中移除",
    "data": {"mint": "ExampleBadToken111111111111111111111111111"}
  }
  ```

#### 获取白名单

- **GET /api/tokens/whitelist**
  - 描述: 获取所有白名单代币
  - 响应: 
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "mint": "ExampleGoodToken22222222222222222222222",
        "symbol": "GOOD",
        "name": "Good Token Example",
        "trusted": true
      }
    ]
  }
  ```

#### 添加到白名单

- **POST /api/tokens/whitelist**
  - 描述: 添加代币到白名单
  - 请求体: 
  ```json
  {
    "mint": "ExampleGoodToken22222222222222222222222",
    "symbol": "GOOD",
    "name": "Good Token Example",
    "trusted": true
  }
  ```
  - 响应: 
  ```json
  {
    "success": true,
    "message": "代币已成功添加到白名单",
    "data": {
      "mint": "ExampleGoodToken22222222222222222222222",
      "symbol": "GOOD",
      "name": "Good Token Example",
      "trusted": true
    }
  }
  ```

#### 从白名单删除

- **DELETE /api/tokens/whitelist/:mint**
  - 描述: 从白名单移除代币
  - 参数: `mint` - 代币Mint地址
  - 响应: 
  ```json
  {
    "success": true,
    "message": "代币已从白名单中移除",
    "data": {"mint": "ExampleGoodToken22222222222222222222222"}
  }
  ```

#### 验证代币

- **GET /api/tokens/validate/:mint**
  - 描述: 验证代币安全状态
  - 参数: `mint` - 代币Mint地址
  - 响应: 
  ```json
  {
    "success": true,
    "mint": "ExampleBadToken111111111111111111111111111",
    "isWhitelisted": false,
    "isBlacklisted": true,
    "reason": "已知诈骗项目"
  }
  ```

### 流动性池接口

#### 获取所有流动性池

- **GET /api/pools**
  - 描述: 获取所有监控中的流动性池
  - 查询参数: 
    - `limit`: 每页数量，默认为20
    - `page`: 页码，默认为1
    - `sort`: 排序方式，可选值 "liquidity", "volume", "apy"，默认为"liquidity"
    - `order`: 排序顺序，可选值 "asc", "desc"，默认为"desc"
    - `dex`: 按DEX筛选，如 "raydium", "orca", "jupiter"
  - 响应:
  ```json
  {
    "success": true,
    "count": 120,
    "page": 1,
    "limit": 20,
    "data": [
      {
        "address": "PoolAddress111111111111111111111111111111",
        "name": "SOL-USDC",
        "dex": "Raydium",
        "tokens": [
          {
            "mint": "So11111111111111111111111111111111111111112",
            "symbol": "SOL"
          },
          {
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "symbol": "USDC"
          }
        ],
        "liquidity": 125432788,
        "volume24h": 15674321,
        "apy": 12.4,
        "price": 103.45,
        "priceChange24h": 5.6
      },
      // ... 更多流动性池
    ]
  }
  ```

#### 获取特定流动性池详情

- **GET /api/pools/:address**
  - 描述: 获取特定地址的流动性池详情
  - 参数: `address` - 池子合约地址
  - 响应:
  ```json
  {
    "success": true,
    "data": {
      "address": "PoolAddress111111111111111111111111111111",
      "name": "SOL-USDC",
      "dex": "Raydium",
      "tokens": [
        {
          "mint": "So11111111111111111111111111111111111111112",
          "symbol": "SOL",
          "name": "Solana",
          "amount": 12500.45,
          "value": 62716225
        },
        {
          "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "symbol": "USDC",
          "name": "USD Coin",
          "amount": 62716563,
          "value": 62716563
        }
      ],
      "liquidity": 125432788,
      "volume": {
        "24h": 15674321,
        "7d": 98765432,
        "30d": 356789012
      },
      "apy": 12.4,
      "fees": {
        "swap": 0.3,
        "lp": 0.25
      },
      "price": {
        "current": 103.45,
        "change24h": 5.6,
        "history": [
          {"timestamp": "2023-11-25T12:00:00.000Z", "price": 98.23},
          {"timestamp": "2023-11-25T18:00:00.000Z", "price": 100.15},
          {"timestamp": "2023-11-26T00:00:00.000Z", "price": 103.45}
        ]
      },
      "createdAt": "2022-05-12T14:25:36.000Z",
      "lastUpdated": "2023-11-26T15:30:45.000Z"
    }
  }
  ```

#### 获取特定DEX的流动性池

- **GET /api/pools/dex/:dexName**
  - 描述: 获取指定DEX的所有流动性池
  - 参数: `dexName` - DEX名称，如 "raydium", "orca", "jupiter"
  - 查询参数: 与 GET /api/pools 相同
  - 响应: 类似 GET /api/pools 的响应格式

#### 获取包含特定代币的流动性池

- **GET /api/pools/token/:mint**
  - 描述: 获取包含指定代币的所有流动性池
  - 参数: `mint` - 代币Mint地址
  - 查询参数: 与 GET /api/pools 相同
  - 响应: 类似 GET /api/pools 的响应格式

#### 获取流动性池统计数据

- **GET /api/pools/stats**
  - 描述: 获取流动性池的统计信息
  - 响应:
  ```json
  {
    "success": true,
    "data": {
      "totalPools": 320,
      "totalLiquidity": 2852647123,
      "totalVolume24h": 356789012,
      "activePoolsByDex": [
        {"dex": "Raydium", "count": 125, "volume24h": 152478963},
        {"dex": "Orca", "count": 95, "volume24h": 98752361},
        {"dex": "Jupiter", "count": 100, "volume24h": 105557688}
      ],
      "topPoolsByLiquidity": [
        {"name": "SOL-USDC", "dex": "Raydium", "liquidity": 125432788},
        {"name": "BTC-USDC", "dex": "Jupiter", "liquidity": 89765432},
        {"name": "ETH-USDC", "dex": "Orca", "liquidity": 75643219}
      ],
      "topPoolsByVolume": [
        {"name": "SOL-USDC", "dex": "Raydium", "volume24h": 15674321},
        {"name": "BTC-USDC", "dex": "Jupiter", "volume24h": 7654321},
        {"name": "ETH-USDC", "dex": "Orca", "volume24h": 6543219}
      ],
      "mostActiveTokens": [
        {"symbol": "USDC", "poolsCount": 245},
        {"symbol": "SOL", "poolsCount": 185},
        {"symbol": "BTC", "poolsCount": 23}
      ]
    }
  }
  ```

### 交易接口

#### 获取交易记录

- **GET /api/transactions**
  - 描述: 获取系统执行的交易记录
  - 查询参数: 
    - `limit`: 每页数量，默认为20
    - `page`: 页码，默认为1
    - `sort`: 排序方式，可选值 "time", "profit", "value"，默认为"time"
    - `order`: 排序顺序，可选值 "asc", "desc"，默认为"desc"
    - `status`: 按状态筛选，可选值 "success", "failed", "pending"
    - `type`: 按类型筛选，可选值 "buy", "sell"
  - 响应:
  ```json
  {
    "success": true,
    "count": 156,
    "page": 1,
    "limit": 20,
    "data": [
      {
        "id": "tx123...7890",
        "timestamp": "2023-11-26T15:30:00.000Z",
        "token": {
          "mint": "So11111111111111111111111111111111111111112",
          "symbol": "SOL",
          "name": "Solana"
        },
        "type": "buy",
        "poolAddress": "PoolAddress111111111111111111111111111111",
        "poolName": "SOL-USDC",
        "amount": 0.5,
        "price": 105.23,
        "value": 52.62,
        "fee": 0.00012,
        "profit": 1.23,
        "status": "success",
        "signature": "5rL6h57UxKBLZRWpCmQYvFvFJJmUn9z2LmQKmzuYKcbDr...",
        "blockTime": 1685432897
      },
      // ... 更多交易记录
    ]
  }
  ```

#### 获取特定交易详情

- **GET /api/transactions/:id**
  - 描述: 获取特定交易的详细信息
  - 参数: `id` - 交易ID
  - 响应:
  ```json
  {
    "success": true,
    "data": {
      "id": "tx123...7890",
      "timestamp": "2023-11-26T15:30:00.000Z",
      "token": {
        "mint": "So11111111111111111111111111111111111111112",
        "symbol": "SOL",
        "name": "Solana"
      },
      "type": "buy",
      "pool": {
        "address": "PoolAddress111111111111111111111111111111",
        "name": "SOL-USDC",
        "dex": "Jupiter"
      },
      "amounts": {
        "input": {
          "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "symbol": "USDC",
          "amount": 52.62
        },
        "output": {
          "mint": "So11111111111111111111111111111111111111112",
          "symbol": "SOL",
          "amount": 0.5
        }
      },
      "price": 105.23,
      "value": 52.62,
      "fees": {
        "network": 0.00005,
        "dex": 0.00007,
        "total": 0.00012
      },
      "profit": 1.23,
      "status": "success",
      "signature": "5rL6h57UxKBLZRWpCmQYvFvFJJmUn9z2LmQKmzuYKcbDr...",
      "blockTime": 1685432897,
      "explorerUrl": "https://solscan.io/tx/5rL6h57UxKBLZRWpCmQYvFvFJJmUn9z2LmQKmzuYKcbDr...",
      "route": [
        {
          "step": 1,
          "from": "USDC",
          "to": "SOL",
          "pool": "SOL-USDC",
          "amount": 52.62
        }
      ]
    }
  }
  ```

#### 获取交易统计数据

- **GET /api/transactions/stats**
  - 描述: 获取交易的统计信息
  -
  查询参数:
    - `timeframe`: 时间范围，可选值 "day", "week", "month", "all"，默认为"all"
  - 响应:
  ```json
  {
    "success": true,
    "data": {
      "totalTrades": 156,
      "successfulTrades": 143,
      "failedTrades": 13,
      "successRate": 91.7,
      "totalProfit": 213.45,
      "totalValue": 12504.32,
      "avgProfit": 1.49,
      "topProfitableTrades": [
        {
          "id": "tx456...3210",
          "token": "JUP",
          "profit": 15.23,
          "timestamp": "2023-11-25T16:45:00.000Z"
        },
        // ... 更多高利润交易
      ],
      "volumeByToken": [
        {"symbol": "SOL", "volume": 5421.54},
        {"symbol": "JUP", "volume": 3265.87},
        {"symbol": "BONK", "volume": 1254.32}
      ],
      "timeDistribution": [
        {"hour": 0, "count": 2},
        {"hour": 1, "count": 1},
        // ... 每小时交易数
        {"hour": 23, "count": 5}
      ],
      "dailyStats": [
        {
          "date": "2023-11-20",
          "trades": 18,
          "volume": 1243.45,
          "profit": 23.45
        },
        // ... 更多每日统计
      ]
    }
  }
  ```

## 🧪 测试

我们提供了一个测试脚本来测试API的功能：

```bash
# 运行API测试脚本
npm run test:api
```

该脚本会测试以下功能：
1. 健康检查
2. 系统状态接口
3. 黑名单操作（获取、添加、验证、删除）
4. 白名单操作（获取、添加、验证、删除）
5. 代币验证和详情
6. 流动性池信息
7. 交易记录
8. 设置管理

## 📋 实用示例

### 使用curl测试API

#### 1. 检查API服务器状态

```bash
curl http://localhost:3000/api/health
```

#### 2. 获取系统状态

```bash
curl http://localhost:3000/api/system/status
```

#### 3. 获取所有黑名单代币

```bash
curl http://localhost:3000/api/tokens/blacklist
```

#### 4. 添加代币到黑名单

```bash
curl -X POST http://localhost:3000/api/tokens/blacklist \
  -H "Content-Type: application/json" \
  -d '{
    "mint": "ExampleBadToken111111111111111111111111111",
    "symbol": "SCAM",
    "name": "Scam Token Example",
    "reason": "已知诈骗项目"
  }'
```

#### 5. 验证代币状态

```bash
curl http://localhost:3000/api/tokens/validate/ExampleBadToken111111111111111111111111111
```

#### 6. 获取流动性池统计

```bash
curl http://localhost:3000/api/pools/stats
```

#### 7. 获取交易记录

```bash
curl "http://localhost:3000/api/transactions?limit=10&status=success"
```

#### 8. 获取当前设置

```bash
curl http://localhost:3000/api/settings
```

### 使用Node.js调用API

```javascript
// 获取系统状态示例
async function getSystemStatus() {
  const response = await fetch('http://localhost:3000/api/system/status');
  const data = await response.json();
  console.log(`系统状态: ${data.data.status}`);
  console.log(`运行时间: ${data.data.uptime}`);
  console.log(`CPU使用率: ${data.data.cpu.usage}%`);
}

// 获取黑名单示例
async function getBlacklist() {
  const response = await fetch('http://localhost:3000/api/tokens/blacklist');
  const data = await response.json();
  console.log(`发现${data.count}个黑名单代币:`);
  console.log(data.data);
}

// 添加代币到白名单示例
async function addToWhitelist(tokenInfo) {
  const response = await fetch('http://localhost:3000/api/tokens/whitelist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tokenInfo)
  });
  const data = await response.json();
  console.log(data.message);
}

// 获取流动性池信息示例
async function getPools() {
  const response = await fetch('http://localhost:3000/api/pools?limit=5&sort=liquidity&order=desc');
  const data = await response.json();
  console.log(`获取到${data.count}个流动性池，显示前5个:`);
  data.data.forEach(pool => {
    console.log(`${pool.name} (${pool.dex}): 流动性 $${pool.liquidity.toLocaleString()}`);
  });
}
```

## 🔒 安全注意事项

1. **身份验证**: API服务器默认不进行身份验证，如需在生产环境使用，请添加适当的身份验证机制：
   - 可考虑添加JWT认证
   - 实现API密钥机制
   - 使用OAuth2授权

2. **HTTPS加密**: 生产环境应使用HTTPS保护API通信安全

3. **访问控制**: 限制API的访问IP，特别是在公共网络环境

4. **代理保护**: 在敏感环境中使用代理或API网关保护API服务器

5. **输入验证**: 所有API输入都应进行严格验证，特别是代币地址格式

## 📊 API架构图

```
┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │
│   前端应用      │◄─────►│   API 服务器    │
│  (Web界面)      │       │                 │
│                 │       └────────┬────────┘
└─────────────────┘                │
                                   │
                           ┌───────▼───────┐
                           │               │
                           │  数据存储系统  │
                           │               │
                           └───────┬───────┘
                                   │
                           ┌───────▼───────┐
                           │               │
                           │   MEV 机器人   │
                           │               │
                           └───────────────┘
```

## 📝 日志

所有API请求和错误都会记录在日志系统中，可通过以下方式查看日志：

```bash
# 查看最新的API服务器日志
tail -f logs/api.log
```

## ❓ 常见问题

1. **Q: API服务器无法启动，显示"端口已被占用"**
   
   A: 检查是否有其他程序使用了配置的端口，或在`.env`中修改`API_PORT`设置

2. **Q: 添加到黑/白名单后，MEV Bot没有立即响应**
   
   A: MEV Bot会定期重新加载黑白名单配置，您也可以重启Bot使更改立即生效

3. **Q: 如何在程序中使用API验证代币安全性?**
   
   A: 可以在交易前调用`/api/tokens/validate/:mint`端点来检查代币是否在黑名单中

4. **Q: 文件存储在哪里?**
   
   A: 黑白名单文件默认存储在`./config/`目录中，可在配置文件中修改路径

5. **Q: 如何优化内存使用?**
   
   A: 可以通过调用`POST /api/system/optimize-memory`API来手动触发内存优化，也可在系统设置中配置自动优化

6. **Q: 如何监控系统状态?**
   
   A: 可以通过定期调用`GET /api/system/status`获取系统状态，结合前端仪表盘可视化展示

## 📞 支持与反馈

如有问题或需要支持，请通过以下方式联系我们：
- 提交Issue
- 发送电子邮件至support@example.com

## 📅 更新日志

- **1.0.0** (2023-07-01): 初始版本发布
- **1.1.0** (2023-08-15): 添加了代币验证API
- **1.2.0** (2023-09-30): 改进了错误处理和日志记录
- **1.3.0** (2023-11-15): 增加了更多请求示例和API架构图
- **2.0.0** (2024-04-01): 重构API服务器，支持独立运行，更好的错误处理和文档
- **2.1.0** (2024-05-15): 完善所有API接口，新增流动性池、交易记录和设置管理接口 
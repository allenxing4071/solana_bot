# Solana 机器人配置指南（渔船航行手册）

这个文档使用渔船和海洋捕鱼的比喻来解释 `config/default.json` 的配置项，帮助您更直观地理解每个配置选项的作用。

## 网络配置（船坞和航行水域）

```json
"network": {
  "cluster": "mainnet-beta",
  "connection": {
    "commitment": "confirmed",
    "confirmTransactionInitialTimeout": 60000
  },
  "rpcUrl": "https://api.mainnet-beta.solana.com",
  "wsUrl": "wss://api.mainnet-beta.solana.com"
}
```

- `cluster`: 航行海域（主网/测试网/开发网）
- `connection`: 船舶通信设备设置
  - `commitment`: 通信可靠度（确认级别）
  - `confirmTransactionInitialTimeout`: 通信超时时间（毫秒）
- `rpcUrl`: 主要通信基站地址
- `wsUrl`: 无线通信信号塔地址

## 钱包配置（船长的保险箱）

```json
"wallet": {
  "privateKey": "您的私钥",
  "maxTransactionAmount": 0.1
}
```

- `privateKey`: 保险箱钥匙（用于签署所有交易）
- `maxTransactionAmount`: 单次最大支出金额（SOL）

## 监控配置（瞭望塔和鱼群探测器）

```json
"monitoring": {
  "poolMonitor": {
    "checkInterval": 5000,
    "targets": [
      {
        "name": "raydium",
        "programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
        "enabled": true
      },
      {
        "name": "orca",
        "programId": "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",
        "enabled": true
      }
    ]
  },
  "priceMonitor": {
    "interval": 3000,
    "sources": ["raydium", "jupiter"]
  }
}
```

- `poolMonitor`: 鱼群聚集地监测系统
  - `checkInterval`: 望远镜扫描间隔（毫秒）
  - `targets`: 重点监测的渔场位置
    - `name`: 渔场名称
    - `programId`: 渔场唯一标识
    - `enabled`: 是否监控该渔场
- `priceMonitor`: 捕获物价值评估系统
  - `interval`: 价格检查频率（毫秒）
  - `sources`: 价格信息来源渠道

## 代理限制（船员资源配额）

```json
"agent": {
  "toolCallLimit": 1000
}
```

- `toolCallLimit`: 船员可使用工具的次数上限

## 交易策略（捕鱼战术手册）

```json
"trading": {
  "buyStrategy": {
    "maxAmountPerTrade": 0.1,
    "maxSlippage": 5,
    "priorityFee": {
      "enabled": true,
      "baseFee": 0.000005,
      "maxFee": 0.00005
    },
    "simulation": {
      "required": true,
      "retryOnFail": 2
    }
  },
  "sellStrategy": {
    "takeProfit": {
      "percentage": 20,
      "enabled": true
    },
    "stopLoss": {
      "percentage": 10,
      "enabled": true
    },
    "trailingStop": {
      "percentage": 5,
      "enabled": false
    },
    "timeLimit": {
      "seconds": 300,
      "enabled": false
    },
    "maxSlippage": 5
  },
  "exchanges": {
    "preferredRoutes": ["raydium", "jupiter", "orca"]
  }
}
```

- `buyStrategy`: 下网捕鱼策略
  - `maxAmountPerTrade`: 单网最大投入（SOL）
  - `maxSlippage`: 最大可接受的鱼价波动（百分比）
  - `priorityFee`: 优先捕捞费用（在竞争激烈的渔场获取优先权）
    - `enabled`: 是否启用优先费
    - `baseFee`: 基础优先费（SOL）
    - `maxFee`: 最高优先费（SOL）
  - `simulation`: 捕鱼模拟（确保渔网完好无损）
    - `required`: 是否必须先模拟再实际下网
    - `retryOnFail`: 模拟失败重试次数
- `sellStrategy`: 卖出捕获物策略
  - `takeProfit`: 获利了结（鱼价上涨到目标价格时卖出）
    - `percentage`: 获利百分比
    - `enabled`: 是否启用获利了结
  - `stopLoss`: 止损点（鱼价下跌到警戒线时卖出止损）
    - `percentage`: 止损百分比
    - `enabled`: 是否启用止损
  - `trailingStop`: 追踪止损（随着鱼价上升而调整止损点）
    - `percentage`: 追踪距离百分比
    - `enabled`: 是否启用追踪止损
  - `timeLimit`: 时间限制（在指定时间内必须卖出）
    - `seconds`: 最长持有时间（秒）
    - `enabled`: 是否启用时间限制
  - `maxSlippage`: 卖出时可接受的最大价格波动（百分比）
- `exchanges`: 交易市场优先级顺序

## 安全设置（船舶安全系统）

```json
"security": {
  "tokenValidation": {
    "useWhitelist": false,
    "useBlacklist": true,
    "minLiquidityUsd": 1000,
    "minPoolBalanceToken": 100,
    "requireMetadata": true,
    "maxInitialPriceUsd": 0.01
  },
  "transactionSafety": {
    "simulateBeforeSend": true,
    "maxRetryCount": 3,
    "maxPendingTx": 5
  }
}
```

- `tokenValidation`: 鱼类筛选标准
  - `useWhitelist`: 是否只捕捞白名单上的鱼种
  - `useBlacklist`: 是否避开黑名单上的危险鱼种
  - `minLiquidityUsd`: 最小市场规模要求（美元）
  - `minPoolBalanceToken`: 鱼群最小数量要求
  - `requireMetadata`: 是否需要完整的鱼类信息
  - `maxInitialPriceUsd`: 新鱼的最高初始价格（美元）
- `transactionSafety`: 交易安全措施
  - `simulateBeforeSend`: 是否先模拟再实际下网
  - `maxRetryCount`: 失败后最大重试次数
  - `maxPendingTx`: 最大同时进行的交易数

## Jito MEV配置（高速捕鱼船设置）

```json
"jitoMev": {
  "enabled": false,
  "tipPercent": 80
}
```

- `enabled`: 是否启用高速船
- `tipPercent`: 支付给引擎手的奖励比例（百分比）

## 通知设置（船长通讯系统）

```json
"notification": {
  "telegram": {
    "enabled": true,
    "botToken": "您的bot令牌",
    "chatId": "您的聊天ID",
    "events": {
      "startup": true,
      "newTokenDetected": true,
      "buyExecuted": true,
      "sellExecuted": true,
      "error": true
    }
  }
}
```

- `telegram`: 电报通讯工具
  - `enabled`: 是否启用通讯
  - `botToken`: 通讯设备ID
  - `chatId`: 通讯频道ID
  - `events`: 需要通报的事件类型
    - `startup`: 船只启航通知
    - `newTokenDetected`: 发现新鱼种通知
    - `buyExecuted`: 捕鱼成功通知
    - `sellExecuted`: 出售渔获通知
    - `error`: 遇到风暴通知

## 日志设置（航海日志记录系统）

```json
"logging": {
  "level": "info",
  "console": true,
  "file": true,
  "filename": "logs/bot.log",
  "maxFiles": 5,
  "maxSize": "10m"
}
```

- `level`: 记录详细程度（debug/info/warn/error）
- `console`: 是否在控制台显示
- `file`: 是否保存到文件
- `filename`: 日志文件位置
- `maxFiles`: 最大保存的日志文件数
- `maxSize`: 单个日志文件大小限制

## 服务器设置（船舶控制中心）

```json
"server": {
  "port": 3000,
  "host": "0.0.0.0"
}
```

- `port`: 控制中心端口号
- `host`: 控制中心主机地址

## API设置（船舶远程控制接口）

```json
"api": {
  "version": "v1",
  "prefix": "/api"
}
```

- `version`: 接口版本
- `prefix`: 接口路径前缀

## CORS设置（远程访问安全策略）

```json
"cors": {
  "origin": "*",
  "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}
```

- `origin`: 允许连接的远程控制台（"*"表示允许所有）
- `methods`: 允许的操作方法

## 服务配置（船舶核心系统）

```json
"services": {
  "poolMonitor": {
    "enabled": true,
    "interval": 5000
  },
  "riskManager": {
    "enabled": true
  },
  "tokenValidator": {
    "enabled": true
  }
}
```

- `poolMonitor`: 鱼群监控系统
  - `enabled`: 是否启用
  - `interval`: 扫描间隔（毫秒）
- `riskManager`: 风险管理系统
  - `enabled`: 是否启用
- `tokenValidator`: 鱼类验证系统
  - `enabled`: 是否启用 
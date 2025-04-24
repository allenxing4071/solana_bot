# 环境变量配置文档

本文档详细说明了系统中使用的所有环境变量，包括其用途、格式要求和示例值。

## 环境变量文件

系统使用`.env`文件存储环境变量。您可以复制`.env.example`文件并重命名为`.env`，然后根据需要修改各项配置。

```bash
cp .env.example .env
```

## 必需的环境变量

以下环境变量是系统正常运行所必需的：

| 环境变量 | 描述 | 格式/可选值 | 默认值 | 示例 |
|----------|------|-------------|--------|------|
| `SOLANA_RPC_URL` | Solana区块链RPC节点URL | 有效的URL地址 | - | `https://api.mainnet-beta.solana.com` |
| `SOLANA_WS_URL` | Solana WebSocket连接URL | 有效的WebSocket URL | - | `wss://api.mainnet-beta.solana.com` |
| `WALLET_PRIVATE_KEY` | 机器人钱包的私钥 | Base58编码字符串 | - | `4xp5YYdLWc93YLHjGvgEjqtte9pjQzxZtNJdekYwMRuPJGwC4hiJemV8UNVvuZC3AS83Yyh2ZFRKzF2jMBQdgw9b` |
| `NODE_ENV` | 运行环境 | `development`,`production`,`test` | `development` | `production` |
| `LOG_LEVEL` | 日志级别 | `debug`,`info`,`warn`,`error` | `info` | `info` |

## 网络配置

| 环境变量 | 描述 | 格式/可选值 | 默认值 | 示例 |
|----------|------|-------------|--------|------|
| `SOLANA_NETWORK` | 使用的Solana网络 | `mainnet-beta`,`testnet`,`devnet` | `mainnet-beta` | `mainnet-beta` |
| `RPC_TIMEOUT_MS` | RPC请求超时时间(毫秒) | 整数 | `30000` | `45000` |
| `RPC_RETRY_COUNT` | RPC请求失败重试次数 | 整数 | `3` | `5` |
| `BACKUP_RPC_URLS` | 备用RPC节点,逗号分隔 | 逗号分隔的URL列表 | - | `https://rpc1.solana.com,https://rpc2.solana.com` |

## 交易设置

| 环境变量 | 描述 | 格式/可选值 | 默认值 | 示例 |
|----------|------|-------------|--------|------|
| `MAX_TRANSACTION_CONFIRMATIONS` | 等待交易确认的最大确认数 | 整数 | `32` | `64` |
| `TRANSACTION_TIMEOUT_MS` | 交易超时时间(毫秒) | 整数 | `60000` | `90000` |
| `MAX_RETRY_COUNT` | 交易失败后最大重试次数 | 整数 | `3` | `5` |
| `GAS_ADJUSTMENT` | Gas调整系数 | 浮点数 | `1.5` | `2.0` |
| `DEFAULT_SLIPPAGE` | 默认滑点容差(百分比) | 浮点数 | `0.5` | `1.0` |
| `PRIORITY_FEE_LAMPORTS` | 优先级费用(lamports) | 整数 | `10000` | `50000` |

## API服务配置

| 环境变量 | 描述 | 格式/可选值 | 默认值 | 示例 |
|----------|------|-------------|--------|------|
| `API_ENABLED` | 是否启用API服务 | `true`,`false` | `false` | `true` |
| `API_PORT` | API服务端口 | 整数 | `3000` | `8080` |
| `API_HOST` | API服务主机地址 | 字符串 | `127.0.0.1` | `0.0.0.0` |
| `API_KEY` | API认证密钥 | 字符串 | - | `your-secret-api-key` |
| `API_RATE_LIMIT` | API请求速率限制(每分钟) | 整数 | `60` | `100` |
| `API_IP_WHITELIST` | 允许访问API的IP白名单 | 逗号分隔的IP列表 | - | `127.0.0.1,192.168.1.10` |

## 运行模式

| 环境变量 | 描述 | 格式/可选值 | 默认值 | 示例 |
|----------|------|-------------|--------|------|
| `BOT_MODE` | 机器人运行模式 | `full`,`listen-only`,`api-service` | `full` | `listen-only` |
| `ENABLE_AUTO_TRADE` | 是否启用自动交易 | `true`,`false` | `false` | `true` |
| `ENABLE_MARKET_MAKING` | 是否启用做市功能 | `true`,`false` | `false` | `true` |
| `ENABLE_ARBITRAGE` | 是否启用套利功能 | `true`,`false` | `false` | `true` |

## 日志和监控

| 环境变量 | 描述 | 格式/可选值 | 默认值 | 示例 |
|----------|------|-------------|--------|------|
| `LOG_TO_FILE` | 是否将日志写入文件 | `true`,`false` | `false` | `true` |
| `LOG_DIR` | 日志文件目录 | 有效的目录路径 | `./logs` | `/var/log/solana-bot` |
| `LOG_FILE_MAX_SIZE` | 单个日志文件最大大小(MB) | 整数 | `10` | `50` |
| `LOG_MAX_FILES` | 保留的最大日志文件数 | 整数 | `5` | `10` |
| `ENABLE_PERFORMANCE_METRICS` | 是否收集性能指标 | `true`,`false` | `false` | `true` |
| `METRICS_PORT` | 指标服务端口 | 整数 | `9090` | `9100` |

## 安全设置

| 环境变量 | 描述 | 格式/可选值 | 默认值 | 示例 |
|----------|------|-------------|--------|------|
| `ENCRYPTION_KEY` | 用于加密敏感数据的密钥 | 字符串 | - | `your-encryption-key` |
| `JWT_SECRET` | JWT令牌密钥 | 字符串 | - | `your-jwt-secret` |
| `ENABLE_RATE_LIMITING` | 是否启用API速率限制 | `true`,`false` | `true` | `true` |
| `CORS_ORIGINS` | 允许的CORS源,逗号分隔 | 逗号分隔的URL列表 | `*` | `https://example.com,https://admin.example.com` |

## 通知设置

| 环境变量 | 描述 | 格式/可选值 | 默认值 | 示例 |
|----------|------|-------------|--------|------|
| `ENABLE_TELEGRAM_NOTIFICATIONS` | 是否启用Telegram通知 | `true`,`false` | `false` | `true` |
| `TELEGRAM_BOT_TOKEN` | Telegram机器人令牌 | 字符串 | - | `123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ` |
| `TELEGRAM_CHAT_ID` | Telegram聊天ID | 字符串 | - | `-1001234567890` |
| `ENABLE_EMAIL_NOTIFICATIONS` | 是否启用邮件通知 | `true`,`false` | `false` | `true` |
| `EMAIL_SERVICE` | 邮件服务提供商 | `smtp`,`sendgrid`,`mailgun` | `smtp` | `sendgrid` |
| `EMAIL_HOST` | SMTP主机地址 | 字符串 | - | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP端口 | 整数 | `587` | `465` |
| `EMAIL_USER` | 邮箱用户名 | 字符串 | - | `bot@example.com` |
| `EMAIL_PASSWORD` | 邮箱密码 | 字符串 | - | `your-email-password` |
| `EMAIL_RECIPIENTS` | 通知邮件接收人,逗号分隔 | 逗号分隔的邮箱列表 | - | `admin@example.com,alert@example.com` |

## 高级设置

| 环境变量 | 描述 | 格式/可选值 | 默认值 | 示例 |
|----------|------|-------------|--------|------|
| `NODE_OPTIONS` | Node.js运行选项 | 字符串 | - | `--max-old-space-size=4096` |
| `ENABLE_CLUSTERING` | 是否启用集群模式 | `true`,`false` | `false` | `true` |
| `CLUSTER_WORKERS` | 集群工作进程数 | 整数或`auto` | `auto` | `4` |
| `CACHE_TTL_SECONDS` | 缓存生存时间(秒) | 整数 | `300` | `600` |
| `DB_CONNECTION_STRING` | 数据库连接字符串 | 字符串 | - | `mongodb://localhost:27017/solana-bot` |
| `PROMETHEUS_ENABLED` | 是否启用Prometheus监控 | `true`,`false` | `false` | `true` |

## 环境变量使用示例

### 开发环境示例

```dotenv
NODE_ENV=development
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
WALLET_PRIVATE_KEY=your-private-key
LOG_LEVEL=debug
API_ENABLED=true
API_PORT=3000
BOT_MODE=listen-only
LOG_TO_FILE=true
```

### 生产环境示例

```dotenv
NODE_ENV=production
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://your-paid-rpc-endpoint.com
SOLANA_WS_URL=wss://your-paid-rpc-endpoint.com
BACKUP_RPC_URLS=https://backup1.com,https://backup2.com
WALLET_PRIVATE_KEY=your-private-key
LOG_LEVEL=info
API_ENABLED=true
API_PORT=8080
API_HOST=0.0.0.0
API_KEY=your-secure-api-key
API_IP_WHITELIST=trusted-ip-1,trusted-ip-2
BOT_MODE=full
ENABLE_AUTO_TRADE=true
LOG_TO_FILE=true
LOG_DIR=/var/log/solana-bot
ENABLE_PERFORMANCE_METRICS=true
ENABLE_TELEGRAM_NOTIFICATIONS=true
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
NODE_OPTIONS=--max-old-space-size=8192
GAS_ADJUSTMENT=2.0
PRIORITY_FEE_LAMPORTS=100000
``` 
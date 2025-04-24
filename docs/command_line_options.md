# 命令行选项文档

本文档详细说明了系统支持的所有命令行选项及其用法。

## 基本用法

```bash
node src/index.js [options]
```

或者使用npm脚本:

```bash
npm start -- [options]
```

## 全局选项

以下选项适用于所有命令:

| 选项 | 简写 | 描述 | 默认值 | 示例 |
|------|------|------|--------|------|
| `--help` | `-h` | 显示帮助信息 | - | `--help` |
| `--version` | `-v` | 显示版本信息 | - | `--version` |
| `--config` | `-c` | 指定配置文件路径 | `.env` | `--config ./config/prod.env` |
| `--log-level` | `-l` | 设置日志级别 | `info` | `--log-level debug` |
| `--verbose` | - | 启用详细输出 | `false` | `--verbose` |
| `--silent` | `-s` | 禁用所有输出 | `false` | `--silent` |

## 运行模式选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--mode` | 设置运行模式 | `full` | `--mode listen-only` |
| `--api-only` | 仅启动API服务 | `false` | `--api-only` |
| `--monitor-only` | 仅启动监控模式 | `false` | `--monitor-only` |
| `--dry-run` | 模拟交易但不实际执行 | `false` | `--dry-run` |

## 网络选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--network` | 设置Solana网络 | `mainnet-beta` | `--network devnet` |
| `--rpc-url` | 设置RPC节点URL | 环境变量中的URL | `--rpc-url https://api.mainnet-beta.solana.com` |
| `--ws-url` | 设置WebSocket URL | 环境变量中的URL | `--ws-url wss://api.mainnet-beta.solana.com` |
| `--commitment` | 设置交易提交级别 | `confirmed` | `--commitment finalized` |

## 钱包选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--wallet-path` | 设置钱包密钥文件路径 | - | `--wallet-path ./wallet/my-keypair.json` |
| `--wallet-password` | 钱包密码(不推荐通过命令行传递) | - | `--wallet-password mypassword` |
| `--use-ledger` | 使用Ledger硬件钱包 | `false` | `--use-ledger` |
| `--derivation-path` | 使用Ledger时的派生路径 | `44'/501'/0'/0'` | `--derivation-path "44'/501'/1'/0'"` |

## 交易选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--max-fee` | 设置最大交易费用(SOL) | `0.01` | `--max-fee 0.05` |
| `--priority-fee` | 设置优先级费用(lamports) | `10000` | `--priority-fee 50000` |
| `--max-retries` | 交易失败时的最大重试次数 | `3` | `--max-retries 5` |
| `--slippage` | 设置滑点容差百分比 | `0.5` | `--slippage 1.0` |
| `--skip-preflight` | 跳过预检验证 | `false` | `--skip-preflight` |
| `--simulate-tx` | 在提交前模拟交易 | `true` | `--simulate-tx false` |

## API服务选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--api-port` | 设置API服务端口 | `3000` | `--api-port 8080` |
| `--api-host` | 设置API服务主机地址 | `127.0.0.1` | `--api-host 0.0.0.0` |
| `--api-prefix` | 设置API路径前缀 | `/api` | `--api-prefix /v1` |
| `--disable-cors` | 禁用CORS支持 | `false` | `--disable-cors` |
| `--enable-auth` | 启用API认证 | `false` | `--enable-auth` |
| `--rate-limit` | 设置API速率限制(每分钟请求数) | `60` | `--rate-limit 100` |

## 监控和日志选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--log-to-file` | 将日志写入文件 | `false` | `--log-to-file` |
| `--log-dir` | 设置日志目录 | `./logs` | `--log-dir /var/log/solana-bot` |
| `--log-format` | 设置日志格式 | `json` | `--log-format text` |
| `--metrics-port` | 设置指标服务端口 | `9090` | `--metrics-port 9100` |
| `--enable-prom` | 启用Prometheus指标 | `false` | `--enable-prom` |
| `--disable-colors` | 禁用控制台颜色输出 | `false` | `--disable-colors` |

## 通知选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--enable-notifications` | 启用通知 | `false` | `--enable-notifications` |
| `--notification-level` | 通知级别 | `error` | `--notification-level info` |
| `--enable-telegram` | 启用Telegram通知 | `false` | `--enable-telegram` |
| `--enable-email` | 启用电子邮件通知 | `false` | `--enable-email` |

## 性能选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--max-memory` | 设置最大内存使用量(MB) | 系统默认 | `--max-memory 4096` |
| `--enable-cluster` | 启用集群模式 | `false` | `--enable-cluster` |
| `--workers` | 设置工作进程数 | CPU核心数 | `--workers 4` |
| `--cache-ttl` | 设置缓存生存时间(秒) | `300` | `--cache-ttl 600` |

## 专业功能选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--auto-trade` | 启用自动交易 | `false` | `--auto-trade` |
| `--market-making` | 启用做市功能 | `false` | `--market-making` |
| `--arbitrage` | 启用套利功能 | `false` | `--arbitrage` |
| `--pair` | 设置要监控的交易对 | - | `--pair SOL/USDC` |
| `--strategy` | 设置交易策略 | `default` | `--strategy momentum` |
| `--risk-level` | 设置风险级别(1-10) | `5` | `--risk-level 3` |

## 监控选项

| 选项 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `--monitor-interval` | 设置监控间隔(秒) | `60` | `--monitor-interval 30` |
| `--alert-threshold` | 设置警报阈值 | `0.9` | `--alert-threshold 0.8` |
| `--health-check-url` | 设置健康检查URL | - | `--health-check-url https://hc.example.com/ping` |

## 用法示例

### 基本启动

```bash
npm start
```

### 使用指定配置文件启动

```bash
npm start -- --config ./config/production.env
```

### 以监听模式启动(不执行交易)

```bash
npm start -- --mode listen-only --verbose
```

### 在devnet上启动

```bash
npm start -- --network devnet --log-level debug
```

### 仅启动API服务

```bash
npm start -- --api-only --api-port 8080 --api-host 0.0.0.0
```

### 启用所有高级功能

```bash
npm start -- --auto-trade --market-making --arbitrage --risk-level 7 --max-fee 0.02
```

### 启用通知

```bash
npm start -- --enable-notifications --enable-telegram --notification-level info
```

### 使用集群模式提高性能

```bash
npm start -- --enable-cluster --workers 4 --max-memory 8192
```

### 完整生产部署示例

```bash
npm start -- --config ./config/prod.env --mode full --network mainnet-beta --wallet-path ./secure/mainnet-wallet.json --priority-fee 50000 --api-port 8080 --api-host 0.0.0.0 --enable-auth --log-to-file --log-dir /var/log/solana-bot --enable-cluster --workers 8 --enable-notifications --enable-telegram --verbose
``` 